const jobService = require("./db/jobService");
const userService = require('./db/userService');
const { printJobs } = require("./helper/ui-console");

exports.createJob = async (opts) => {
    const modes = [opts.interval, opts.cron].filter(Boolean);
    if (modes.length === 0) {
        console.log("Choose exactly one of --interval or --cron for the scheduling");
        process.exit(1)
    }
    const mode = modes[0];
    const { name, storage = [] } = opts;
    const adminUser = await userService.adminUser();
    const job = {
        name,
        storages: storage,
        status: "running",
        scheduleType: opts.cron ? "cron" : "interval",
        scheduleValue: mode,
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


exports.disableJob = async (opts) => {
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

exports.enableJob = async (opts) => {
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

exports.listJob = async (opts) => {
    const adminUser = await userService.adminUser();
    const jobList = await jobService.listJob({ userId: adminUser });
    printJobs(jobList);
    process.exit(0);
}