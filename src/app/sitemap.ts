import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
 
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const supabase = await createClient()
  
  // Fetch all story slugs
  const { data: stories } = await supabase
    .from('stories')
    .select('slug, updated_at')
    .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
  
  const storyEntries: MetadataRoute.Sitemap = (stories || []).map((story) => ({
    url: `${siteUrl}/truyen/${story.slug}`,
    lastModified: new Date(story.updated_at),
    changeFrequency: 'daily',
    priority: 0.8,
  }))
  
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${siteUrl}/truyen`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...storyEntries,
  ]
}
