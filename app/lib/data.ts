import modelsData from '@/data/models.json';
import newsData from '@/data/model-news.json';

// Merge news into models
export const getModels = () => {
  return modelsData.map(model => {
    const news = (newsData as Record<str, any>)[model.id] || [];
    return {
      ...model,
      news
    };
  });
};

export const models = getModels();
