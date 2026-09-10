import re

with open('QuantumLab_Project_Documentation.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. URL Replacements
content = content.replace('https://quantum-sim-lab.vercel.app', 'https://GitHappensqsim.vercel.app')
content = content.replace('quantum-sim-lab.vercel.app', 'GitHappensqsim.vercel.app')

# 2. Add Mermaid.js to head
mermaid_script = '''
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.0/dist/mermaid.min.js"></script>
  <script>
    document.addEventListener("DOMContentLoaded", function() {
      mermaid.initialize({ 
        startOnLoad: true, 
        theme: "base", 
        themeVariables: { 
          fontFamily: "Inter, sans-serif" 
        } 
      });
    });
  </script>
</head>'''

if '<script src="https://cdn.jsdelivr.net/npm/mermaid' not in content:
    content = content.replace('</head>', mermaid_script)

# 3. Replace ASCII Architecture with Mermaid diagram
mermaid_diagram = '''<div class="arch-box" style="border: none; background: transparent; padding: 0; display: flex; justify-content: center;">
<pre class="mermaid">
flowchart TD
    %% Styling Classes
    classDef client fill:#f8fafc,stroke:#3b82f6,stroke-width:2px,color:#0f172a,rx:8px,ry:8px
    classDef backend fill:#f8fafc,stroke:#10b981,stroke-width:2px,color:#0f172a,rx:8px,ry:8px
    classDef database fill:#f8fafc,stroke:#f59e0b,stroke-width:2px,color:#0f172a,rx:8px,ry:8px
    classDef python fill:#f8fafc,stroke:#8b5cf6,stroke-width:2px,color:#0f172a,rx:8px,ry:8px
    classDef external fill:#f1f5f9,stroke:#94a3b8,stroke-width:2px,color:#0f172a,stroke-dasharray: 5 5,rx:8px,ry:8px
    classDef component fill:#ffffff,stroke:#cbd5e1,stroke-width:1px,color:#334155,rx:4px,ry:4px,font-size:14px

    subgraph Client[💻 CLIENT BROWSER - React 19 SPA Vite]
        direction TB
        UI[Pages: Dashboard, Algorithms, Sandbox, CMS]:::component
        Ctx[Providers: Auth, Theme, Algorithm]:::component
        UI -.- Ctx
    end
    class Client client

    subgraph Backend[⚙️ EXPRESS.JS BACKEND - Node.js]
        direction TB
        Sec[Security Layer: Helmet, CORS, Rate Limit]:::component
        API[API Routes: /api/algorithms, /api/auth...]:::component
        Mid[Middleware: Caching, Auth Checks]:::component
        Sec --> API --> Mid
    end
    class Backend backend

    subgraph DB[🗄️ DATABASE]
        Mongo[(MongoDB Atlas)]:::component
    end
    class DB database

    subgraph QEngine[⚛️ QUANTUM EXECUTION ENGINE - Python]
        direction TB
        PM[Papermill + Qiskit Aer]:::component
        NB[Jupyter Notebooks: 12 Algorithms]:::component
        PM --> NB
    end
    class QEngine python

    subgraph ExtServices[☁️ EXTERNAL APIs]
        direction TB
        Ext[Cloudinary, Google OAuth, GNews API]:::component
    end
    class ExtServices external

    Client -- "HTTPS (Axios + JWT)" --> Backend
    Backend --> DB
    Backend -- "Spawns child process" --> QEngine
    Backend --> ExtServices
</pre>
</div>'''

content = re.sub(r'<div class="arch-box">.*?</div>', mermaid_diagram, content, flags=re.DOTALL)

with open('QuantumLab_Project_Documentation.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Documentation updated successfully.")
