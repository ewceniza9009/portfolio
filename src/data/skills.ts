import {
  SiSharp, SiDotnet, SiBlazor, SiReact, SiAngular, SiFlutter,
  SiPostgresql, SiMongodb, SiMysql, SiSqlite, SiRedis,
  SiDocker, SiGit, SiTailwindcss, SiPython,
  SiTensorflow, SiOpencv, SiElasticsearch,
} from "react-icons/si"

type SkillItem = { name: string; icon?: React.ComponentType<{ size?: number }> }

const skills: Record<string, { image: string; items: SkillItem[] }> = {
  frontend: {
    image: "/img/1-thumbnail.jpg",
    items: [
      { name: "Blazor", icon: SiBlazor },
      { name: "ASP.NET Core MVC", icon: SiDotnet },
      { name: "React", icon: SiReact },
      { name: "Angular", icon: SiAngular },
      { name: "Flutter", icon: SiFlutter },
      { name: ".NET MAUI", icon: SiDotnet },
      { name: "Xamarin Forms" },
    ]
  },
  backend: {
    image: "/img/2-thumbnail.jpg",
    items: [
      { name: "C#", icon: SiSharp },
      { name: ".NET 8/9+", icon: SiDotnet },
      { name: "ASP.NET Web API", icon: SiDotnet },
      { name: "Entity Framework", icon: SiDotnet },
      { name: "Python", icon: SiPython },
      { name: "TensorFlow", icon: SiTensorflow },
      { name: "OpenCV", icon: SiOpencv },
    ]
  },
  database: {
    image: "/img/3-thumbnail.jpg",
    items: [
      { name: "MS SQL Server" },
      { name: "PostgreSQL", icon: SiPostgresql },
      { name: "MongoDB", icon: SiMongodb },
      { name: "MySQL", icon: SiMysql },
      { name: "SQLite", icon: SiSqlite },
      { name: "Redis", icon: SiRedis },
      { name: "Elasticsearch", icon: SiElasticsearch },
    ]
  },
  tools: {
    image: "/img/4-thumbnail.jpg",
    items: [
      { name: "Docker", icon: SiDocker },
      { name: "Azure" },
      { name: "Git", icon: SiGit },
      { name: "Tailwind CSS", icon: SiTailwindcss },
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
      { name: "MVVM" },
      { name: "Microservices" },
    ]
  }
}

export default skills