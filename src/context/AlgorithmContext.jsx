import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getAlgorithms as fetchAlgorithmsAPI } from "../services/api";

const AlgorithmContext = createContext(null);

/**
 * Provides global algorithm state to the component tree.
 * Now fetches algorithms from MongoDB via the backend API.
 */
export function AlgorithmProvider({ children }) {
  const [algorithmList, setAlgorithmList] = useState([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(null);
  const [parameters, setParameters] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch algorithms from backend API
  const refreshAlgorithms = useCallback(async () => {
    try {
      const data = await fetchAlgorithmsAPI();
      setAlgorithmList(data);
    } catch (err) {
      console.error("Failed to fetch algorithms:", err);
      setAlgorithmList([]);
    }
  }, []);

  useEffect(() => {
    async function load() {
      await refreshAlgorithms();
      setInitialLoading(false);
    }
    load();
  }, [refreshAlgorithms]);

  const selectAlgorithm = useCallback((algorithmId) => {
    const algo = algorithmList.find((a) => a.id === algorithmId);
    if (algo) {
      setSelectedAlgorithm(algo);
      setResult(null);
      setError(null);
      // Initialize parameters with defaults
      const defaults = {};
      algo.parameters.forEach((param) => {
        defaults[param.name] = param.default ?? "";
      });
      setParameters(defaults);
    }
  }, [algorithmList]);

  const updateParameter = useCallback((name, value) => {
    setParameters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setRunResult = useCallback((data) => {
    setResult(data);
    setError(null);
  }, []);

  const value = {
    algorithmList,
    selectedAlgorithm,
    selectAlgorithm,
    parameters,
    updateParameter,
    setParameters,
    result,
    setRunResult,
    loading,
    setLoading,
    error,
    setError,
    initialLoading,
    refreshAlgorithms,
  };

  return (
    <AlgorithmContext.Provider value={value}>
      {children}
    </AlgorithmContext.Provider>
  );
}

export function useAlgorithmContext() {
  const context = useContext(AlgorithmContext);
  if (!context) {
    throw new Error(
      "useAlgorithmContext must be used within an AlgorithmProvider"
    );
  }
  return context;
}

export default AlgorithmContext;
