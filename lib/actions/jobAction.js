const jobService = require("../db/jobService");
const userService = require('../db/userService');
const { getSourceConfByTargetName } = require("../helper/mapConfig");
const { printJobs, printJobRuns } = require("../helper/ui-console");
const { validCronExpression, parseIntervalToSeconds } = require("../helper/validation");
const { runJob } = require("./../handlers/jobs")

async function createJob (opts) {
    const modes = [opts.interval, opts.cron].filter(Boolean);
    let scheduleValue = "";

    if (modes.length === 0) {
        console.log("Choose exactly one of --interval or --cron for the scheduling");
        process.exit(1)
    }

    let sourceConf = getSourceConfByTargetName(opts.target);
    if (!sourceConf)
        throw new Error(`The configuration ${opts.target} does not exists.`);

    if (opts.cron) {
        if (!validCronExpression(opts.cron)) {
            throw new Error(`Cron expression ${opts.cron} is not valid.`);
        }
        scheduleValue = opts.cron;
    }

    if (opts.interval) {
        scheduleValue = parseIntervalToSeconds(opts.interval);
    }

    const { name } = opts;
    const adminUser = await userService.adminUser();
    const job = {
        name,
        target: opts.target,
        status: "running",
        scheduleType: opts.cron ? "cron" : "interval",
        scheduleValue,
        createdBy: adminUser.id
    };
    const res = await jobService.insert(job);
    if (res.success) {
        console.log("Job created with success.");
        process.exit(0)
    } else {
        console.log("Error creating job: ", res.message)
    }
}


const disableJob = async (opts) => {
    const ids = [opts.name, opts.id].filter(Boolean);
    if (ids.length === 0) {
        console.log("Precise --id or --name for the job to disable")
    }
    const [id] = ids;
    const field = opts.name ? "name" : "id"
    const res = await jobService.update({ [field]: id }, { status: "disabled" });
    if (res.success) {
        console.log(`The job ${id} is disabled.`);
        process.exit(0);
    } else {
        console.log(error.message);
        process.exit(1);
    }
}

const enableJob = async (opts) => {
    const ids = [opts.name, opts.id].filter(Boolean);
    if (ids.length === 0) {
        console.log("Precise --id or --name for the job to be enable")
    }
    const [id] = ids;
    const field = opts.name ? "name" : "id"
    const res = await jobService.update({ [field]: id }, { status: "running" });
    if (res.success) {
        console.log(`The job ${id} is now enable.`);
        process.exit(0);
    } else {
        console.log(error.message);
        process.exit(1);
    }
}

const listJob = async (opts) => {
    const adminUser = await userService.adminUser();
    const jobList = await jobService.listJob({ userId: adminUser });
    printJobs(jobList);
    process.exit(0);
}

const jobRunList = async (jobId, opts) => {
    const jobRunParams = {
        jobId,
        status: opts.status,
        since: opts.since ? new Date(opts.since).getTime() / 1000 : null
    }
    const jobRunList = await jobService.getJobRuns(jobRunParams);
    printJobRuns(jobRunList);
}

const callRunJob = async (jobId) => {
    try {
        await runJob(jobId);
        console.log("The job is executed with success.")
    } catch (error) {
        console.log("Unable to run job, with error: ", error.message);
    }
}

module.exports = {
    createJob,
    disableJob,
    enableJob,
    listJob,
    jobRunList,
    callRunJob
}