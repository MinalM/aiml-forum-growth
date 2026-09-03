/**
 * Content Curator Agent Script
 * Automatically logs in/registers as an agent user and publishes technical guides to https://cerulean-marshmallow-003d16.netlify.app/
 */

export interface ForumPostPayload {
  title: string;
  content: string;
  category: string; // Mongo ObjectId
  tags?: string[];
  aiMlLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'all';
}

export interface ForumAnchorGuide {
  title: string;
  categoryName: string;
  contentMarkdown: string;
  tags: string[];
  aiMlLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'all';
}

export class ContentCuratorAgent {
  private forumApiBaseUrl = process.env.FORUM_API_BASE_URL || 'https://cerulean-marshmallow-003d16.netlify.app/api';
  private agentEmail = process.env.FORUM_AGENT_EMAIL || 'antigravity-agent@forum.com';
  private agentPassword = process.env.FORUM_AGENT_PASSWORD || 'AgentPass123!';
  private jwtToken = process.env.FORUM_JWT_TOKEN || '';
  private defaultCategoryId = process.env.FORUM_DEFAULT_CATEGORY_ID || '';

  public generateAnchorGuide(topic: string): ForumAnchorGuide {
    console.log(`[ContentCurator] Generating technical guide for topic: "${topic}"...`);

    return {
      title: 'Full-Stack Developer to LLM Engineer: 6-Month Actionable Roadmap',
      categoryName: 'Roadmaps',
      tags: ['llm', 'roadmap', 'python', 'career'],
      aiMlLevel: 'beginner',
      contentMarkdown: `
# Full-Stack Developer to LLM Engineer: 6-Month Actionable Roadmap

If you are currently building web applications using React, Node.js, Python, or Go, your existing software engineering fundamentals (APIs, system design, databases, Git) put you in a prime position to transition into **LLM Engineering**.

---

## Phase 1: Python Deep Dive & Math Foundations (Months 1–2)
- **Focus:** Async Python, Pydantic, NumPy, Matrix Algebra.
- **Goal:** Be comfortable manipulating tensors and handling async data streams.
- **Key Resources:** 3Blue1Brown Linear Algebra series, Python AsyncIO docs.

---

## Phase 2: RAG, Embeddings, & Vector Databases (Months 3–4)
- **Focus:** OpenAI API, LangChain / LlamaIndex, Pinecone / ChromaDB, Hybrid Search.
- **Hands-On Project:** Build a documentation search assistant over custom PDFs.

---

## Phase 3: Fine-Tuning & Model Deployment (Months 5–6)
- **Focus:** Hugging Face Transformers, LoRA/QLoRA fine-tuning, vLLM serving, Docker.
- **Hands-On Project:** Fine-tune LLaMA-3-8B on domain-specific support tickets.

---

### Join the Discussion!
- *What is your biggest obstacle in transitioning to AI engineering?*
- *Share your current project below for peer feedback!*
`.trim(),
    };
  }

  /**
   * Authenticates the agent with the Forum backend via /api/users/login or /api/users/register
   */
  public async authenticateAgent(): Promise<string> {
    if (this.jwtToken) return this.jwtToken;

    console.log(`[ContentCurator] Attempting automated agent login as (${this.agentEmail})...`);

    try {
      // 1. Try Login
      const loginRes = await fetch(`${this.forumApiBaseUrl}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.agentEmail, password: this.agentPassword }),
      });

      if (loginRes.ok) {
        const data = await loginRes.json();
        const token = data.token || (loginRes.headers.get('set-cookie') ? 'cookie-authenticated' : '');
        if (token) {
          console.log(`[ContentCurator] ✅ Agent logged in successfully.`);
          this.jwtToken = token;
          return token;
        }
      }

      // 2. If Login fails, try registering the Agent account automatically
      console.log(`[ContentCurator] Account not found. Registering new agent user...`);
      const regRes = await fetch(`${this.forumApiBaseUrl}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Antigravity AI Curator',
          email: this.agentEmail,
          password: this.agentPassword,
          role: 'user',
        }),
      });

      if (regRes.ok) {
        const data = await regRes.json();
        if (data.token) {
          console.log(`[ContentCurator] ✅ Agent user registered & authenticated.`);
          this.jwtToken = data.token;
          return data.token;
        }
      } else {
        console.warn(`[ContentCurator] Registration status: ${regRes.status}`);
      }
    } catch (err) {
      console.warn(`[ContentCurator] Auth warning:`, err);
    }

    return '';
  }

  public async fetchCategories(): Promise<{ _id: string; name: string }[]> {
    try {
      const res = await fetch(`${this.forumApiBaseUrl}/categories`);
      if (res.ok) {
        const json = await res.json();
        return json.data || json;
      }
    } catch (e) {
      console.warn(`[ContentCurator] Could not fetch categories from ${this.forumApiBaseUrl}/categories:`, e);
    }
    return [];
  }

  public async publishGuideToForum(guide: ForumAnchorGuide): Promise<boolean> {
    console.log(`[ContentCurator] Preparing live publish to ${this.forumApiBaseUrl}/posts...`);

    const token = await this.authenticateAgent();

    if (!token) {
      console.log(`[ContentCurator] [SIMULATION MODE] Agent could not authenticate to live endpoint ${this.forumApiBaseUrl}`);
      console.log(`[ContentCurator] Ensure your forum server at ${this.forumApiBaseUrl} is running and reachable.`);
      return false;
    }

    try {
      // Resolve Category ID
      let categoryId = this.defaultCategoryId;
      if (!categoryId) {
        const categories = await this.fetchCategories();
        const found = categories.find((c) => c.name.toLowerCase() === guide.categoryName.toLowerCase());
        if (found) {
          categoryId = found._id;
        } else if (categories.length > 0) {
          categoryId = categories[0]._id;
        }
      }

      if (!categoryId) {
        console.error(`[ContentCurator] ❌ Unable to resolve Category ID. Provide FORUM_DEFAULT_CATEGORY_ID.`);
        return false;
      }

      const payload: ForumPostPayload = {
        title: guide.title,
        content: guide.contentMarkdown,
        category: categoryId,
        tags: guide.tags,
        aiMlLevel: guide.aiMlLevel,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token !== 'cookie-authenticated') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.forumApiBaseUrl}/posts`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[ContentCurator] 🎉 SUCCESS! Post published to live forum! ID: ${result.data?._id || 'ok'}`);
        return true;
      } else {
        const errText = await response.text();
        console.error(`[ContentCurator] ❌ HTTP ${response.status} Error from Forum API:`, errText);
        return false;
      }
    } catch (err) {
      console.error(`[ContentCurator] ❌ Network error while posting to Forum API:`, err);
      return false;
    }
  }
}

// Runnable Execution
if (require.main === module) {
  const agent = new ContentCuratorAgent();
  const guide = agent.generateAnchorGuide('Full-Stack to LLM Engineer');
  agent.publishGuideToForum(guide).then((success) => {
    console.log(`[ContentCurator] Execution finished. Live Publish Status: ${success ? 'SUCCESS' : 'SIMULATION/UNAUTHENTICATED'}`);
  });
}
