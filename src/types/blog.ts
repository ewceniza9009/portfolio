export interface Blog {
  id: string
  slug: string
  title: string
  content: string
  summary: string | null
  tags: string | null
  category: string | null
  published: number
  likes: number
  read_time: string | null
  cover_image: string | null
  created_at: string
  updated_at?: string
  devto_summary?: string | null
  social_summary?: string | null
}

export interface Comment {
  id: string
  blog_id: string
  author_name: string
  author_email: string | null
  content: string
  created_at: string
}

export interface Message {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  replied: number
  reply_subject: string | null
  reply_body: string | null
  replied_at: string | null
  created_at: string
}
