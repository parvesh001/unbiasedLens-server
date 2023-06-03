const nodemailer = require('nodemailer')
const sendgridTransport = require('nodemailer-sendgrid-transport')

const sendMail = async({sender, receiver, subject,htmlContent})=>{
   const transport = nodemailer.createTransport(
    sendgridTransport({
        auth: {
          api_key: process.env.SENDGRID_EMAIL_API_KEY
        },
      })
   )

   const emailOptions = {
    from:sender,
    to:receiver,
    subject,
    html:htmlContent
   }

  await transport.sendMail(emailOptions)
}

module.exports = sendMail