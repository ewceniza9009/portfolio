import {
  SiSharp, SiDotnet, SiBlazor, SiReact, SiAngular, SiFlutter,
  SiPostgresql, SiMongodb, SiMysql, SiSqlite, SiRedis,
  SiDocker, SiGit, SiTailwindcss, SiPython,
  SiTensorflow, SiOpencv, SiElasticsearch,
  SiNodedotjs, SiExpress, SiGraphql, SiTypescript,
  SiHtml5, SiCss, SiJquery, SiBootstrap, SiGithub, SiGithubactions,
  SiIonic
} from "react-icons/si"

type SkillItem = { name: string; icon?: React.ComponentType<{ size?: number }> }

const skills: Record<string, { image: string; items: SkillItem[] }> = {
  backend: {
    image: "/img/2-thumbnail.jpg",
    items: [
      { name: "C#", icon: SiSharp },
      { name: "ASP.NET Core", icon: SiDotnet },
      { name: "ASP.NET Core MVC", icon: SiDotnet },
      { name: ".NET 8/9+", icon: SiDotnet },
      { name: "Node.js", icon: SiNodedotjs },
      { name: "Express", icon: SiExpress },
      { name: "Entity Framework", icon: SiDotnet },
      { name: "LINQ" },
      { name: "Dapper" },
      { name: "GraphQL", icon: SiGraphql },
      { name: "Apollo Federation" },
      { name: "Hot Chocolate" },
      { name: "SignalR" },
      { name: "Microsoft Graph API" },
      { name: "VBA" },
      { name: "Python", icon: SiPython },
      { name: "TensorFlow", icon: SiTensorflow },
      { name: "OpenCV", icon: SiOpencv },
      { name: "Gemini AI" },
    ]
  },
  frontend: {
    image: "/img/1-thumbnail.jpg",
    items: [
      { name: "React", icon: SiReact },
      { name: "Angular", icon: SiAngular },
      { name: "TypeScript", icon: SiTypescript },
      { name: "Blazor", icon: SiBlazor },
      { name: "WPF" },
      { name: ".NET MAUI", icon: SiDotnet },
      { name: "Windows Forms" },
      { name: "HTML5", icon: SiHtml5 },
      { name: "CSS3", icon: SiCss },
      { name: "jQuery", icon: SiJquery },
      { name: "Bootstrap", icon: SiBootstrap },
      { name: "Tailwind CSS", icon: SiTailwindcss },
      { name: "Flutter", icon: SiFlutter },
      { name: "Ionic", icon: SiIonic },
      { name: "Xamarin Forms" },
    ]
  },
  database: {
    image: "/img/3-thumbnail.jpg",
    items: [
      { name: "MS SQL Server" },
      { name: "MS Access" },
      { name: "PostgreSQL", icon: SiPostgresql },
      { name: "MongoDB", icon: SiMongodb },
      { name: "MySQL", icon: SiMysql },
      { name: "SQLite", icon: SiSqlite },
      { name: "Elasticsearch", icon: SiElasticsearch },
      { name: "Redis", icon: SiRedis },
    ]
  },
  tools: {
    image: "/img/4-thumbnail.jpg",
    items: [
      { name: "GitHub", icon: SiGithub },
      { name: "GitHub Actions", icon: SiGithubactions },
      { name: "Git", icon: SiGit },
      { name: "Azure DevOps" },
      { name: "Azure CI/CD" },
      { name: "Azure" },
      { name: "Docker", icon: SiDocker },
      { name: "Telerik" },
      { name: "DevExpress" },
      { name: "Syncfusion" },
    ]
  },
  practices: {
    image: "/img/5-thumbnail.jpg",
    items: [
      { name: "Clean Architecture" },
      { name: "CQRS" },
      { name: "Domain-Driven Design" },
      { name: "SOLID" },
      { name: "OOP" },
      { name: "MVVM" },
      { name: "Microservices" },
      { name: "Multithreading" },
      { name: "Async & Concurrency" },
    ]
  }
}

export default skills