import { Inngest } from "inngest";
import { EventSchemas } from "inngest";

// Define event types here or import them
type ArticleCreated = {
    data: {
        articleId: string;
        userId: string;
        url: string;
    };
};

type Events = {
    "app/article.created": ArticleCreated;
};

export const inngest = new Inngest({
    id: "pagechime-api",
    eventKey: process.env.INNGEST_EVENT_KEY,
    schemas: new EventSchemas().fromRecord<Events>(),
});
