/**
 * A class that provides the ability to run a Snakemake pipeline asynchronously. Files or jobs to be
 * processed are added to a queue and processed in turn or a job can be run immediately.
 */
const { spawn } = require('child_process');
const Deque = require("collections/deque");
const { verbose, warn, trace } = require("./utils");

class PipelineRunner {

    /**
     * Constructor
     * @property {String} name
     * @property {String} snakefile (absolute) path to the snakemake file
     * @property {String} configfile (absolute) path to the snakemake config file
     * @property {Array} configOptions list of config options to be passed to snakemake via `--config`
     * @property {Function} onSuccess callback when snakemake is successful. Arguments: `job`
     * @property {Boolean} queue
     */
    constructor(name, snakefile, configfile, configOptions, onSuccess, queue = false) {
        this._name = name;
        this._snakefile = snakefile;
        this._configfile = configfile;
        this._onSuccess = onSuccess; // calback

        this._configOptions = configOptions;

        this._isRunning = false;
        if (queue) {
            this._jobQueue = new Deque();
            this._jobQueue.observeRangeChange(() => {
                this._runJobsInQueue();
            });
        }
    }

    /**
     * Run a job immediately
     * @param job
     * @returns {Promise<void>}
     */
    async runJob(job) {
        if (this._jobQueue) {
            throw new Error(`Pipeline, ${this._name}, has a queue - call addToQueue()`)
        }
        this._isRunning = true;
        await this._runPipeline(job);
        this._isRunning = false;
        this._onSuccess(job);
    }

    /**
     * Add a job to the queue for processing
     * @param job
     * @returns {Promise<void>}
     */
    async addToQueue(job) {
        try {
            if (!this._jobQueue) {
                throw new Error(`Pipeline, ${this._name}, is not set up with a queue`)
            }
            const requiredProperties = ["inputPath", "outputPath", "filenameStem"];
            requiredProperties.forEach((p) => {
                if (!job.hasOwnProperty(p)) {
                    throw new Error(`Jobs submitted to the ${this._name} pipeline must have properties ${requiredProperties.join(", ")}.`)
                }
            })
        } catch (err) {
            trace(err);
            warn(err.message);
            return;
        }
        this._jobQueue.push(job);
    }

    /**
     * private method to actually spawn a Snakemake pipeline and capture output.
     * @param job
     * @returns {Promise<*>}
     * @private
     */
    async _runPipeline(job) {
        return new Promise((resolve, reject) => {
            const pipelineConfig = [];
            pipelineConfig.push(`input_path=${job.inputPath}`);
            pipelineConfig.push(`output_path=${job.outputPath}`);
            pipelineConfig.push(`filename_stem=${job.filenameStem}`);
            if (this._configOptions) {
                // optional additional configuration options from configuration files
                pipelineConfig.push(...this._configOptions);
            }
            if (job.configOptions) {
                // optional additional configuration options from the job
                pipelineConfig.push(...job.configOptions);
            }

            let spawnArgs = [
                '--snakefile', this._snakefile,
                '--configfile', this._configfile,
                '--config', ...pipelineConfig
            ];

            // verbose(`pipeline (${this._name})`, `snakemake ` + spawnArgs.join(" "));

            const process = spawn('snakemake', spawnArgs);

            const out = [];
            process.stdout.on(
                'data',
                (data) => {
                    out.push(data.toString());
                    verbose(`pipeline (${this._name})`, data.toString());
                }
            );


            const err = [];
            process.stderr.on(
                'data',
                (data) => {
                    err.push(data.toString());
                    // Snakemakes put info on stderr so only show it if it returns an error code
                    // warn(data.toString());
                }
            );

            process.on('exit', (code, signal) => {
                verbose(`pipeline (${this._name})`, `pipeline finished with exit code ${code}`);
                if (code === 0) {
                     resolve();
                } else {
                    err.forEach( (line) => warn(line) );
                    reject();
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
        if (!this._isRunning && this._jobQueue.length > 0) {
            this._isRunning = true;

            verbose(`pipeline (${this._name})`, `queue length: ${this._jobQueue.length+1}`);

            const job = this._jobQueue.shift();
            try {
                await this._runPipeline(job);
                this._onSuccess(job);
            } catch (err) {
                trace(err);
            }
            this._isRunning = false;

            this._runJobsInQueue(); // recurse
        }
    };

}

module.exports = { PipelineRunner };
