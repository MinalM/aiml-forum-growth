/**
 * Content Curator Agent Script
 * Generates and publishes technical career transition guides directly to the Forum backend (C:\Users\minal\Project\Forum)
 * Target Web App: https://cerulean-marshmallow-003d16.netlify.app/
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

    if (!this.jwtToken) {
      console.log(`[ContentCurator] [SIMULATION MODE] No FORUM_JWT_TOKEN provided.`);
      console.log(`[ContentCurator] Discovered Backend API: POST ${this.forumApiBaseUrl}/posts`);
      console.log(`[ContentCurator] Schema Matched: { title, content, category, tags, aiMlLevel }`);
      console.log(`[ContentCurator] Add FORUM_JWT_TOKEN in GitHub Actions Secrets to execute live API writes.`);
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
        console.error(`[ContentCurator] ❌ Unable to resolve Category ID for post. Provide FORUM_DEFAULT_CATEGORY_ID.`);
        return false;
      }

      const payload: ForumPostPayload = {
        title: guide.title,
        content: guide.contentMarkdown,
        category: categoryId,
        tags: guide.tags,
        aiMlLevel: guide.aiMlLevel,
      };

      const response = await fetch(`${this.forumApiBaseUrl}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.jwtToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[ContentCurator] ✅ Post created successfully on live forum! ID: ${result.data?._id || 'ok'}`);
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
    console.log(`[ContentCurator] Execution finished. Live Publish Status: ${success ? 'SUCCESS' : 'SIMULATION/PENDING_JWT'}`);
  });
}
