import PostalMime from "postal-mime";

export interface Env {
  API_URL: string;
  WEBHOOK_SECRET: string;
}

export default {
  async email(
    message: ForwardableEmailMessage,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    try {
      // Extract the forwarding hash from the recipient address (part before @inbox.pagechime.com)
      const recipientAddress = message.to;
      const forwardingHash = recipientAddress.split("@")[0];

      // Read the raw email stream into an ArrayBuffer for postal-mime
      const rawEmail = await new Response(message.raw).arrayBuffer();

      // Parse the email using postal-mime
      const parser = new PostalMime();
      const parsed = await parser.parse(rawEmail);

      // Extract sender details from parsed email
      const senderEmail = parsed.from?.address ?? message.from;
      const senderName = parsed.from?.name ?? "";
      const subject = parsed.subject ?? "";
      const htmlBody = parsed.html ?? "";
      const textBody = parsed.text ?? "";

      // POST to the PageChime webhook
      const webhookUrl = `${env.API_URL}/api/webhooks/newsletter-received`;

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.WEBHOOK_SECRET}`,
        },
        body: JSON.stringify({
          forwardingHash,
          senderEmail,
          senderName,
          subject,
          htmlBody,
          textBody,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "(unreadable)");
        console.error(
          `Webhook POST failed: ${response.status} ${response.statusText} — ${errorText}`
        );
      } else {
        console.log(
          `Email forwarded successfully for hash=${forwardingHash} from=${senderEmail}`
        );
      }
    } catch (err) {
      // Log but do not rethrow — throwing in an email handler causes a bounce
      console.error("Unhandled error in email handler:", err);
    }
  },
};
