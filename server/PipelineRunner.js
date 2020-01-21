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
var kill = require('tree-kill');
const { verbose, warn } = require("./utils");

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
        this._key = config.key;
        this._process = undefined; // a reference to the running process
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

    _convertConfigObjectToArrayOfStrings(configObject) {
        const charsToQuote = [" ", "{", "}", "|", ">", "<", "*", "&", ";"];
        const quoteIfNeeded = (data) =>
            charsToQuote.map((c) => data.includes(c)).filter((a) => !!a).length ? `"${data}"` : data
        return Object.entries(configObject)
            .map(([key, value]) => {
                /* if value is the empty string, snakemake just sees the key */
                if (value === "") {
                    return key;
                }
                /* string & number values go to key=string */
                if (typeof(value) === "string" || typeof(value) === "number") {
                    return `${key}=${quoteIfNeeded(value)}`;
                }
                /* `key -> [v1, v2, v3]` goes to `key=v1,v2,v3` */
                if (Array.isArray(value)) {
                    return `${key}=${quoteIfNeeded(value.join(','))}`;
                }
                /* key -> {ik: iv, ...} only works if all the inner values are strings */
                if (value.constructor === Object) {
                    const strDict = Object.entries(value)
                        .map(([innerKey, innerValue]) => {
                            if (innerValue === "") return innerKey;
                            if (typeof(innerValue) === "string" || typeof(innerValue) === "number") {
                                return `${innerKey}:${innerValue}`;
                            }
                            warn(`Error parsing dict options for pipeline ${this._key}. Key: ${key}, value: ${value}. Ignoring.`);
                            return ""
                        })
                        .filter((d) => d!=="")
                        .join(",");
                    return `${key}=${quoteIfNeeded(strDict)}`;
                }
                warn(`Error parsing options for pipeline ${this._key}. Key: ${key}, value: ${value}`);
                return "";
            })
            .filter((d) => d!=="")
    }

    /**
     * private method to actually spawn a Snakemake pipeline and capture output.
     * @param {Object} job snakemake config key-value pairs
     * @returns {Promise<*>}
     * @private
     */
    async _runPipeline(job) {
        return new Promise((resolve, reject) => {

            let pipelineConfig = {}; // what snakemake's going to receive via `--config`
            // add in any (optional) configuration options defined for the entire pipeline
            if (this._configOptions) {
                pipelineConfig = {...pipelineConfig, ...this._configOptions}
            }
            // add in job-specific config options
            pipelineConfig = {...pipelineConfig, ...job};

            let spawnArgs = ['--snakefile', this._snakefile];
            if (this._configfile) {
                spawnArgs.push(...['--configfile', this._configfile])
            }
            if (Object.keys(pipelineConfig).length) {
                spawnArgs.push(...['--config', ...this._convertConfigObjectToArrayOfStrings(pipelineConfig)]);
            }
            spawnArgs.push('--nolock');
            spawnArgs.push('--rerun-incomplete');

            verbose(`pipeline (${this._name})`, `snakemake ` + spawnArgs.join(" "));

            this._sendMessage("start", job.name || "");

            this._process = spawn('snakemake', spawnArgs);

            const out = [];
            this._process.stdout.on(
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
            this._process.stderr.on(
                'data',
                (data) => {
                    stderr.push(data.toString());
                    // Snakemakes put info on stderr so only show it if it returns an error code
                    // warn(data.toString());
                    // TODO -- pass to frontend where appropriate
                }
            );

            this._process.on('error', (err) => {
                this._sendMessage("error", "job failed");
                this._process = undefined;
                reject(`pipeline (${this._name}) failed to run - is Snakemake installed and on the Path?`);
            });

            this._process.on('exit', (code) => {
                this._process = undefined;
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
                    warn(err)
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
            key: this._key,
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

    terminateCurrentlyRunningJob() {
        if (!this._isRunning) {
            warn(`Attempted to terminate currently running job for ${this._name} but no job was running!`)
            this._sendMessage("error", "Attempted to terminate currently running job but no job was running!", getTimeNow());
        }
        // Note that the "main" snakemake process can spawn child processes and that
        // this._process.kill(<SIGNAL>) will not reach these children! (This is _different_
        // to using ctrl+c).
        // `SIGKILL` seems to be the only signal which snakemake respects.
        verbose(`pipeline (${this._name})`, `Killing job (PID: ${this._process.pid})`);
        this._sendMessage("info", "Killing job", getTimeNow());
        kill(this._process.pid, 'SIGKILL');
    }

}

function getTimeNow() {
  return String(new Date()).split(/\s/)[4];
}

/**
 * Create a job with relevant options
 * @param {string} key
 * @param {string} sampleName
 */
function createJob({key, sampleName}) {
    let job = {};
    /* basic information */
    job.sample_name = sampleName;
    job.barcodes = global.datastore.getBarcodesForSampleName(sampleName);
    /* if filtering in place, then specify this */
    if (Object.keys(global.config.display.filters).length) {
        job = {...job, ...global.config.display.filters};
    }
    /* supply paths which the job may use */
    job.annotated_path = global.config.run.annotatedPath;
    job.basecalled_path = global.config.run.basecalledPath;
    job.output_path = global.config.run.workingDir;
    return job;
}


module.exports = { PipelineRunner, sendCurrentPipelineStatuses, createJob };

