import { Remedy } from './types';
import { searchRemedies } from './claudeClient';

/**
 * Searches for similar clinical cases and knowledge base entries based on a list of symptoms.
 * This modern implementation delegates all vector embedding and cosine similarity
 * logic to the FastAPI backend, ensuring precision and keeping API keys secure.
 * 
 * @param symptoms - List of patient symptoms (e.g., ["dry cough", "fever"])
 * @param topK - Number of results to return (default: 5)
 * @returns A promise that resolves to an array of matching Remedy objects.
 */
export async function searchSimilarRemedies(
  symptoms: string[],
  topK = 5
): Promise<Remedy[]> {
  try {
    // We reuse the central searchRemedies function from our AI client
    return await searchRemedies(symptoms, topK);
  } catch (error) {
    console.error("Vector Search Failed:", error);
    // Return empty results instead of crashing the UI
    return [];
  }
}

/**
 * Legacy support for text queries
 */
export async function searchRemediesByQuery(
  query: string,
  topK = 5
): Promise<Remedy[]> {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  return searchSimilarRemedies(words, topK);
}
