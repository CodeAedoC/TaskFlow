import { createContext, useState, useContext, useEffect } from "react";
import { projectsAPI } from "../services/api";

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within ProjectProvider");
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getProjects();
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async (projectData) => {
    try {
      const response = await projectsAPI.createProject(projectData);
      setProjects((prev) => [response.data, ...prev]);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const updateProject = async (id, projectData) => {
    try {
      const response = await projectsAPI.updateProject(id, projectData);
      setProjects((prev) =>
        prev.map((p) => (p._id === id ? response.data : p))
      );
      if (selectedProject?._id === id) {
        setSelectedProject(response.data);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const deleteProject = async (id) => {
    try {
      await projectsAPI.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      if (selectedProject?._id === id) {
        setSelectedProject(null);
      }
    } catch (error) {
      throw error;
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        selectedProject,
        setSelectedProject,
        loading,
        createProject,
        updateProject,
        deleteProject,
        refreshProjects: fetchProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
