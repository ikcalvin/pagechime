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
    schemas: new EventSchemas().fromRecord<Events>(),
});
