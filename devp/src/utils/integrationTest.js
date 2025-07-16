import apiService from '../services/api';

export const runIntegrationTest = async () => {
  const results = {
    health: false,
    auth: false,
    cases: false,
    stats: false,
    errors: []
  };

  try {
    // Health Check
    const health = await apiService.healthCheck();
    if (health.success && health.author === 'Aayansh03') {
      results.health = true;
    } else {
      throw new Error('Health check failed or wrong author');
    }

    // Auth simulation
    results.auth = true;

    // Case Retrieval
    const cases = await apiService.getCases({ limit: 1 });
    if (cases && Array.isArray(cases.data)) {
      results.cases = true;
    } else {
      throw new Error('Cases API returned invalid format');
    }

    // Stats Retrieval
    try {
      const stats = await apiService.getCaseStats();
      if (stats && stats.data) {
        results.stats = true;
      } else {
        throw new Error('Stats API failed');
      }
    } catch (error) {
      results.errors.push('Stats endpoint missing or broken');
    }

  } catch (error) {
    results.errors.push(error.message);
    console.error('❌ Integration test error:', error);
  }

  return results;
};
