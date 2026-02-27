const { config: globalConfig } = require("./../../config");
const { jobFailedTemplate } = require("./mailTemplate");
const nodemailer = require("nodemailer");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

const createSMTPTransport = (config) => {
    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: Boolean(config.secure),
        auth: config.auth ? { user: config.auth.user, pass: config.auth.password } : undefined
    })
}

const sendSMTP = async (config, mail) => {
    const transporter = createSMTPTransport(config);
    return transporter.sendMail(mail);
}

const sendSES = async (config, { subject, text }) => {
    const sesClient = new SESClient({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
        }
    })

    const command = new SendEmailCommand({
        Source: config.from,
        Destination: {
            ToAddresses: Array.isArray(config.to) ? config.to : [config.to]
        },
        Message: {
            Subject: { Data: subject },
            Body: {
                Text: { Data: text }
            }
        }
    })

    return sesClient.send(command);
}

const sendMail = ({ provider, mail }) => {
    switch (provider.provider) {
        case "smtp": 
            return sendSMTP(globalConfig.SMTP, mail);
        case "ses":
            return sendSES(globalConfig.SES, mail);
        default:
            throw new Error("Unsuported provider");
    }
}

exports.sendEmailFailedBackup = async ({provider, job}) => {
    const template = jobFailedTemplate({ jobName: job.name, date: job.date });
    return sendMail({ provider, mail: template })
}   