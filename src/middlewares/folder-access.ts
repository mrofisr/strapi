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
  // Only allow access to these folders (if provided)
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

        // If allowedFolders is specified in the config, enforce restrictions.
        if (config.allowedFolders && !config.allowedFolders.includes(folder)) {
          ctx.throw(403, `Access to folder "${folder}" is not allowed.`);
        }

        // Query only files from a specific folder using the "$startsWith" operator
        const files: StrapiFile[] = await strapi.query('plugin::upload.file').findMany({
          where: {
            folder: {
              path: {
                $startsWith: `/${folder}`,
              },
            },
          },
          populate: true,
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