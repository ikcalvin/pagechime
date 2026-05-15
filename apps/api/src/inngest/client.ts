import { Inngest } from "inngest";
import { EventSchemas } from "inngest";

type ArticleCreated = {
    data: {
        articleId: string;
        userId: string;
        url: string;
    };
};

type NewsletterReceived = {
    data: {
        issueId: string;
        userId: string;
        sourceId: string;
    };
};

type BriefingGenerate = {
    data: {
        userId: string;
        date: string;
    };
};

type Events = {
    "app/article.created": ArticleCreated;
    "app/newsletter.received": NewsletterReceived;
    "app/briefing.generate": BriefingGenerate;
};

export const inngest = new Inngest({
    id: "pagechime-api",
    eventKey: process.env.INNGEST_EVENT_KEY,
    schemas: new EventSchemas().fromRecord<Events>(),
});
