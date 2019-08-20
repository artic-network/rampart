/**
 * A class that provides the ability to run a Snakemake pipeline asynchronously. Files or jobs to be
 * processed are added to a queue and processed in turn or a job can be run immediately.
 */
const { spawn } = require('child_process');
const Deque = require("collections/deque");
const { verbose, warn } = require("./utils");

class PipelineRunner {

    /**
     * Constructor
     */
    constructor(name, snakefilePath, configfilePath, configOptions, queue = false) {
        this._name = name;
        this._snakefilePath = snakefilePath;
        this._configfilePath = configfilePath;

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
    }

    /**
     * Add a job to the queue for processing
     * @param job
     * @returns {Promise<void>}
     */
    async addToQueue(job) {
        if (!this._jobQueue) {
            throw new Error(`Pipeline, ${this._name}, is not set up with a queue`)
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
                '--snakefile', this._snakefilePath + "Snakefile",
                '--configfile', this._configfilePath + this._configfile,
                // '--cores', '2',
                '--config', ...pipelineConfig
            ];

            verbose("pipeline runner", `[${this_name}]: snakemake ` + spawnArgs.join(" "));

            const annotationScript = spawn('snakemake', spawnArgs);


            const out = [];
            process.stdout.on(
                'data',
                (data) => {
                    out.push(data.toString());
                    verbose("pipeline runner", data.toString());
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
                verbose("pipeline runner", `[${this_name}]: pipeline finished with exit code ${code}`);
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

            verbose("pipeline runner", `[${this_name}] queue length: ${this._jobQueue.length+1}`);

            const job = this._jobQueue.shift();
            try {
                await this._runPipeline(job);
            } catch (err) {
                console.trace(err);
                warn(`Processing / extracting time of ${fileToAnnotateBasename}: ${err}`);
            }
            this._isRunning = false;

            this._start(); // recurse
        }
    };

}

module.exports = { PipelineRunner };
