import { Context, Next } from 'koa';

interface StrapiFile {
  id: number;
  name: string;
  url: string;
  mime: string;
  size: number;
  folder?: {
    id: number;
    name: string;
    path: string;
  };
  created_at: string;
  updated_at: string;
}

interface FolderAccessConfig {
  // Add any configuration options here
  allowedFolders?: string[];
}

export default (config: FolderAccessConfig, { strapi }: { strapi: any }) => {
  return async (ctx: Context, next: Next): Promise<void> => {
    if (ctx.path.startsWith('/api/upload/files')) {
      try {
        // Get the requested folder from query parameter
        const folder: string | undefined = ctx.query.folder as string;

        if (!folder) {
          return await next();
        }

        // Query only files from specific folder
        const files: StrapiFile[] = await strapi.query('plugin::upload.file').findMany({
          where: {
            folder: {
              path: {
                startsWith: `/${folder}`
              }
            }
          },
          populate: true
        });

        ctx.body = files;
        return;
      } catch (err) {
        ctx.throw(500, err instanceof Error ? err.message : 'Unknown error');
      }
    }
    await next();
  };
};
