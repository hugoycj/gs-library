export async function getScenes() {
    try {
      const response = await fetch('https://3dgs-benchmark.s3.amazonaws.com/scenes.json');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const scenes = await response.json();
      return scenes;
    } catch (error) {
      console.error('Error fetching scenes:', error);
      throw error;
    }
  }
  
  export async function getModels() {
    try {
      const response = await fetch('https://3dgs-benchmark.s3.amazonaws.com/models.json');
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const models = await response.json();
      return models;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }