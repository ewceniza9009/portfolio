import {
  SiSharp, SiDotnet, SiBlazor, SiReact, SiAngular, SiFlutter,
  SiPostgresql, SiMongodb, SiMysql, SiSqlite, SiRedis,
  SiDocker, SiGit, SiTailwindcss, SiPython,
  SiTensorflow, SiOpencv, SiElasticsearch,
  SiNodedotjs, SiExpress, SiGraphql, SiTypescript,
  SiHtml5, SiCss, SiJquery, SiBootstrap, SiGithub, SiGithubactions,
  SiIonic
} from "react-icons/si"

export type SkillItem = { 
  name: string; 
  icon?: React.ComponentType<{ size?: number }>;
  level?: 'core' | 'familiar';
}

const skills: Record<string, { image: string; items: SkillItem[] }> = {
  backend: {
    image: "/img/2-thumbnail.jpg",
    items: [
      { name: "C#", icon: SiSharp, level: "core" },
      { name: "VBA", level: "familiar" },
      { name: "ASP.NET Core", icon: SiDotnet, level: "core" },
      { name: "ASP.NET Core MVC", icon: SiDotnet, level: "core" },
      { name: ".NET 8/9+", icon: SiDotnet, level: "core" },
      { name: "Node.js", icon: SiNodedotjs, level: "core" },
      { name: "Express", icon: SiExpress, level: "core" },
      { name: "Entity Framework", icon: SiDotnet, level: "core" },
      { name: "LINQ", level: "core" },
      { name: "Dapper", level: "core" },
      { name: "GraphQL", icon: SiGraphql, level: "core" },
      { name: "Apollo Federation", level: "familiar" },
      { name: "Hot Chocolate", level: "familiar" },
      { name: "SignalR", level: "familiar" },
      { name: "Microsoft Graph API", level: "familiar" },
      { name: "Python", icon: SiPython, level: "familiar" },
      { name: "TensorFlow", icon: SiTensorflow, level: "familiar" },
      { name: "OpenCV", icon: SiOpencv, level: "familiar" },
      { name: "Gemini AI", level: "familiar" },
    ]
  },
  frontend: {
    image: "/img/1-thumbnail.jpg",
    items: [
      { name: "React", icon: SiReact, level: "core" },
      { name: "Angular", icon: SiAngular, level: "core" },
      { name: "TypeScript", icon: SiTypescript, level: "core" },
      { name: "Blazor", icon: SiBlazor, level: "familiar" },
      { name: "WPF", level: "familiar" },
      { name: ".NET MAUI", icon: SiDotnet, level: "familiar" },
      { name: "Windows Forms", level: "familiar" },
      { name: "HTML5", icon: SiHtml5, level: "core" },
      { name: "CSS3", icon: SiCss, level: "core" },
      { name: "jQuery", icon: SiJquery, level: "familiar" },
      { name: "Bootstrap", icon: SiBootstrap, level: "familiar" },
      { name: "Tailwind CSS", icon: SiTailwindcss, level: "core" },
      { name: "Flutter", icon: SiFlutter, level: "familiar" },
      { name: "Ionic", icon: SiIonic, level: "familiar" },
      { name: "Xamarin Forms", level: "familiar" },
    ]
  },
  database: {
    image: "/img/3-thumbnail.jpg",
    items: [
      { name: "MS SQL Server", level: "core" },
      { name: "MS Access", level: "familiar" },
      { name: "PostgreSQL", icon: SiPostgresql, level: "core" },
      { name: "MongoDB", icon: SiMongodb, level: "familiar" },
      { name: "MySQL", icon: SiMysql, level: "core" },
      { name: "SQLite", icon: SiSqlite, level: "core" },
      { name: "Elasticsearch", icon: SiElasticsearch, level: "familiar" },
      { name: "Redis", icon: SiRedis, level: "familiar" },
    ]
  },
  tools: {
    image: "/img/4-thumbnail.jpg",
    items: [
      { name: "GitHub", icon: SiGithub, level: "core" },
      { name: "GitHub Actions", icon: SiGithubactions, level: "core" },
      { name: "Git", icon: SiGit, level: "core" },
      { name: "Azure DevOps", level: "core" },
      { name: "Azure CI/CD", level: "core" },
      { name: "Azure", level: "core" },
      { name: "Docker", icon: SiDocker, level: "core" },
      { name: "Telerik", level: "familiar" },
      { name: "DevExpress", level: "familiar" },
      { name: "Syncfusion", level: "familiar" },
    ]
  },
  practices: {
    image: "/img/5-thumbnail.jpg",
    items: [
      { name: "Clean Architecture", level: "core" },
      { name: "CQRS", level: "core" },
      { name: "Domain-Driven Design", level: "core" },
      { name: "SOLID", level: "core" },
      { name: "OOP", level: "core" },
      { name: "MVVM", level: "core" },
      { name: "Microservices", level: "core" },
      { name: "Multithreading", level: "familiar" },
      { name: "Async & Concurrency", level: "familiar" },
    ]
  }
}

export default skills