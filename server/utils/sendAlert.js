import { BrevoClient } from '@getbrevo/brevo';

const brevo = new BrevoClient({
  apiKey: `${process.env.BREVO_API_KEY}`,
});

async function sendAlert(toEmail, tender){
    try{
        const deadlineDisplay = tender.deadline ? new Date(tender.deadline).toLocaleString() : 'Check portal';
        const result = await brevo.transactionalEmails.sendTransacEmail({
          subject: `New matching tender: ${tender.title}`,
          htmlContent: `
             <h2>${tender.title}</h2>
             <p><strong>Department:</strong> ${tender.department || 'N/A'}</p>
             <p><strong>Reference No:</strong> ${tender.referenceNo || 'N/A'}</p>
             <p><strong>Deadline:</strong> ${deadlineDisplay}</p>
             ${tender.sourceUrl ? `<p><a href="${tender.sourceUrl}" target="_blank">View Tender on Portal</a></p>` : ''}`,
          sender: { name: "GovTapp", email: `${process.env.BREVO_SENDER_EMAIL}` },
          to: [{ email: toEmail }]
        });
        return result;
    }catch(err){
        console.error(`Failed to send alert to ${toEmail}:`, err.message || err);
        throw err;
    }
}

export default sendAlert;