interface PuterChatOptions {
  model?: string
  stream?: boolean
  tools?: any[]
}

interface PuterChatTextPart {
  text: string
  type: 'text'
}

interface PuterChatResponse {
  toString(): string
  [Symbol.asyncIterator](): AsyncIterator<PuterChatTextPart>
}

interface PuterAIModule {
  chat(prompt: string, options?: PuterChatOptions): Promise<PuterChatResponse>
  chat(prompt: string, imageUrl: string, options?: PuterChatOptions): Promise<PuterChatResponse>
  txt2speech(text: string, options?: { provider?: string; voice?: string; model?: string; instructions?: string }): Promise<HTMLAudioElement>
}

declare global {
  interface Window {
    puter?: {
      auth?: {
        signIn(): Promise<void>
        signOut(): Promise<void>
        isSignedIn(): boolean
        getUser(): Promise<{ username: string; uuid: string } | null>
      }
      ai?: PuterAIModule
    }
  }
}

export {}
