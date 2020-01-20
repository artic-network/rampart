/*
 * Copyright (c) 2019 ARTIC Network http://artic.network
 * https://github.com/artic-network/rampart
 *
 * This file is part of RAMPART. RAMPART is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version. RAMPART is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 *
 * See the GNU General Public License for more details. You should have received a copy of the GNU General Public License
 * along with RAMPART. If not, see <http://www.gnu.org/licenses/>.
 *
 */


const { spawn } = require('child_process');
const Deque = require("collections/deque");
const { verbose, warn, fatal } = require("./utils");

const sendCurrentPipelineStatuses = () => {
    Object.values(global.pipelineRunners).forEach((r) => r._resendLastMessage());
}

/**
 * A class that provides the ability to run a Snakemake pipeline asynchronously. Files or jobs to be
 * processed are added to a queue and processed in turn or a job can be run immediately.
 */
class PipelineRunner {

    /**
     * Constructor
     * @property {Object}         opts
     * @property {object}         opts.config         The pipeline config definition.
     * @property {false|Function} opts.onSuccess      callback when snakemake is successful. Callback arguments: `job`. Only used if `queue` is true.
     * @property {Boolean}        opts.queue
     */
    constructor({config, onSuccess=false, queue=false}) {
        this._name = config.name;
        this._snakefile = config.path + "Snakefile";
        this._configfile = config.config_file ?
            config.path + config.config_file :
            false;

        this._configOptions = config.configOptions;

        this._processedCount = 0;

        this._isRunning = false;
        if (queue) {
            this._onSuccess = onSuccess; // callback
            this._jobQueue = new Deque();
            this._jobQueue.observeRangeChange(() => {
                this._runJobsInQueue();
            });
        }

        /* Record the last message sent, so if a browser reconnects / refreshes we can send the state.
        In the future this could be a log of all messages */
        this._lastMessageSent = ["init", "Pipeline constructed. No job yet run.", getTimeNow()];
        this._uid = config.key;

    }

    /**
     * Run a job immediately. Note that the `onSuccess` callback is not used via this method.
     * @param job
     * @returns {Promise<void>} the promise
     * @throws if the pipeline fails or if this pipeline is set up with a queue
     */
    async runJob(job) {
        if (this._jobQueue) {
            throw new Error(`Pipeline, ${this._name}, has a queue - call addToQueue()`)
        }
        this._isRunning = true;
        await this._runPipeline(job); // will throw if job fails
        this._isRunning = false;
    }

    /**
     * Add a job to the queue for processing. When a job is successfully run the `onSuccess` callback will run.
     * @param job
     * @returns {undefined}
     * @throws if the runner is not set up with a queue
     */
    addToQueue(job) {
        global.sendMessageFromPipeline();
        if (!this._jobQueue) {
            throw new Error(`Pipeline, ${this._name}, is not set up with a queue`)
        }
        this._jobQueue.push(job);
    }

    _convertConfigObjectToArray(configObject) {
        return Object.entries(configObject).map(([key, value]) => {
            /* `key -> [v1, v2, v3]` goes to `key=v1,v2,v3` */
            if (Array.isArray(value)) {
                return `${key}=${value.join(',')}`;
            }
            /* `key -> value` goes to `key=value` (`value` quoted if necessary) */
            return `${key}=${value.toString().indexOf(' ') !== -1 || value.toString().indexOf('{') !== -1 ? `"${value}"` : value}`;
        });

    }
    /**
     * private method to actually spawn a Snakemake pipeline and capture output.
     * @param {Object} job snakemake config key-value pairs
     * @returns {Promise<*>}
     * @private
     */
    async _runPipeline(job) {
        return new Promise((resolve, reject) => {
            const pipelineConfig = []; // the strings to be passed to snakemake via `--config`

            // start with (optional) configuration options defined for the entire pipeline
            if (this._configOptions) {
                pipelineConfig.push(...this._convertConfigObjectToArray(this._configOptions));
            }

            // add in job-specific config options
            pipelineConfig.push(...this._convertConfigObjectToArray(job));

            let spawnArgs = ['--snakefile', this._snakefile];
            if (this._configfile) {
                spawnArgs.push(...['--configfile', this._configfile])
            }
            if (pipelineConfig.length) {
                spawnArgs.push(...['--config', ...pipelineConfig]);
            }
            spawnArgs.push('--nolock');
            spawnArgs.push('--rerun-incomplete');

            verbose(`pipeline (${this._name})`, `snakemake ` + spawnArgs.join(" "));

            this._sendMessage("start", job.name || "");

            const process = spawn('snakemake', spawnArgs);

            const out = [];
            process.stdout.on(
                'data',
                (data) => {
                    const message = data.toString();
                    if (message.startsWith("####")) {
                        // pass message to front end
                        this._sendMessage("info", message.substring(4).trim());
                    }
                    out.push(message);
                    verbose(`pipeline (${this._name})`, message);
                }
            );

            const stderr = [];
            process.stderr.on(
                'data',
                (data) => {
                    stderr.push(data.toString());
                    // Snakemakes put info on stderr so only show it if it returns an error code
                    // warn(data.toString());
                    // TODO -- pass to frontend where appropriate
                }
            );

            process.on('error', (err) => {
                this._sendMessage("error", "job failed");
                reject(`pipeline (${this._name}) failed to run - is Snakemake installed and on the Path?`);
            });

            process.on('exit', (code) => {
                if (code === 0) {
                    this._sendMessage("success", job.name || "");
                    resolve();
                } else {
                    this._sendMessage("error", `Job failed (exit code ${code}`);
                    warn(`pipeline (${this._name}) finished with exit code ${code}. Error messages:`);
                    stderr.forEach( (line) => warn(`\t${line}`) );
                    reject(`pipeline (${this._name}) finished with exit code ${code}`);
                }
            });
        });
    }

    /**
     * Private method that runs an jobs in the queue. Called whenever the queue length changes.
     * @returns {Promise<void>}
     * @private
     */
    async _runJobsInQueue() {
        if (this._jobQueue.length > 0) {
            if (!this._isRunning) {
                this._isRunning = true;

                verbose(`pipeline (${this._name})`, `queue length: ${this._jobQueue.length + 1}, processed ${this._processedCount} files`);

                const job = this._jobQueue.shift();
                try {
                    await this._runPipeline(job);
                    this._processedCount += 1;
                    if (this._onSuccess) this._onSuccess(job);
                } catch (err) {
                    // trace(err);
                    fatal(err)
                }
                this._isRunning = false;

                this._runJobsInQueue(); // recurse
            }
        } else {
            verbose(`pipeline (${this._name})`, `queue empty, processed ${this._processedCount} files`);
        }
    };

    /** Method to be called when you are finished with a PipelineRunner to remove it from the registry.
     * Partial implementation. TODO.
     */
    close() {
        delete global.pipelineRunners[this.key];
        this._sendMessage("closed", "Pipeline now closed.");
    }

    /** send a message to the client */
    _sendMessage(msgType, msgText, msgTime) {
        global.sendMessageFromPipeline({
            uid: this._uid,
            name: this._name,
            type: msgType,
            content: msgText,
            time: msgTime || getTimeNow()
        });
        this._lastMessageSent = [msgType, msgText, msgTime || getTimeNow()];
    }

    _resendLastMessage() {
        this._sendMessage(...this._lastMessageSent);
    }

}

function getTimeNow() {
  return String(new Date()).split(/\s/)[4];
}

module.exports = { PipelineRunner, sendCurrentPipelineStatuses };
