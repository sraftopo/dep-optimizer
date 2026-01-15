import { PackageMetadata } from './package-analyzer';

/**
 * Similarity score between two packages
 */
export interface SimilarityScore {
  package1: string;
  package2: string;
  score: number;
  reasons: string[];
}

/**
 * Analyzer for calculating similarity between packages based on descriptions and keywords
 */
export class SimilarityAnalyzer {
  private readonly similarityThreshold = 0.7; // 70% similarity threshold

  /**
   * Calculate similarity score between two packages
   */
  calculateSimilarity(
    pkg1: PackageMetadata,
    pkg2: PackageMetadata
  ): SimilarityScore {
    const reasons: string[] = [];
    let totalScore = 0;
    let weightSum = 0;

    // Description similarity (weight: 0.6)
    if (pkg1.description && pkg2.description) {
      const descScore = this.calculateTextSimilarity(
        pkg1.description.toLowerCase(),
        pkg2.description.toLowerCase()
      );
      totalScore += descScore * 0.6;
      weightSum += 0.6;
      if (descScore > 0.5) {
        reasons.push('similar descriptions');
      }
    }

    // Keyword overlap (weight: 0.3)
    if (pkg1.keywords && pkg2.keywords && pkg1.keywords.length > 0 && pkg2.keywords.length > 0) {
      const keywordScore = this.calculateKeywordOverlap(pkg1.keywords, pkg2.keywords);
      totalScore += keywordScore * 0.3;
      weightSum += 0.3;
      if (keywordScore > 0.3) {
        reasons.push('shared keywords');
      }
    }

    // Name similarity (weight: 0.1) - lower weight as names can be very different
    const nameScore = this.calculateTextSimilarity(
      pkg1.name.toLowerCase(),
      pkg2.name.toLowerCase()
    );
    totalScore += nameScore * 0.1;
    weightSum += 0.1;

    const finalScore = weightSum > 0 ? totalScore / weightSum : 0;

    return {
      package1: pkg1.name,
      package2: pkg2.name,
      score: finalScore,
      reasons,
    };
  }

  /**
   * Find similar packages for a given package
   */
  findSimilarPackages(
    targetPackage: PackageMetadata,
    allPackages: Map<string, PackageMetadata>,
    threshold: number = this.similarityThreshold
  ): SimilarityScore[] {
    const similarities: SimilarityScore[] = [];

    for (const [name, pkg] of allPackages.entries()) {
      if (name.toLowerCase() === targetPackage.name.toLowerCase()) {
        continue; // Skip self
      }

      const similarity = this.calculateSimilarity(targetPackage, pkg);
      if (similarity.score >= threshold) {
        similarities.push(similarity);
      }
    }

    // Sort by score (highest first)
    similarities.sort((a, b) => b.score - a.score);

    return similarities;
  }

  /**
   * Calculate text similarity using word overlap and Levenshtein distance
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    if (text1 === text2) return 1;

    // Word overlap score
    const words1 = this.extractWords(text1);
    const words2 = this.extractWords(text2);
    const wordOverlap = this.calculateWordOverlap(words1, words2);

    // Levenshtein distance score (normalized)
    const maxLen = Math.max(text1.length, text2.length);
    const levenshteinDist = this.levenshteinDistance(text1, text2);
    const levenshteinScore = maxLen > 0 ? 1 - levenshteinDist / maxLen : 0;

    // Combine both scores (weighted average)
    return wordOverlap * 0.7 + levenshteinScore * 0.3;
  }

  /**
   * Extract words from text (remove common stop words)
   */
  private extractWords(text: string): string[] {
    const stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'the', 'this', 'but', 'they', 'have',
      'had', 'what', 'said', 'each', 'which', 'their', 'time', 'if',
      'up', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her',
      'would', 'make', 'like', 'into', 'him', 'has', 'two', 'more', 'very',
      'after', 'words', 'long', 'than', 'first', 'been', 'call', 'who',
      'oil', 'sit', 'now', 'find', 'down', 'day', 'did', 'get', 'come',
      'made', 'may', 'part', 'library', 'libraries', 'package', 'packages',
      'npm', 'node', 'js', 'javascript', 'typescript', 'ts',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Calculate word overlap between two word arrays
   */
  private calculateWordOverlap(words1: string[], words2: string[]): number {
    if (words1.length === 0 || words2.length === 0) return 0;

    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    // Jaccard similarity
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,     // deletion
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j - 1] + 1  // substitution
          );
        }
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Calculate keyword overlap between two keyword arrays
   */
  private calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const set1 = new Set(keywords1.map(k => k.toLowerCase()));
    const set2 = new Set(keywords2.map(k => k.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    // Jaccard similarity
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Infer category from package metadata
   */
  inferCategory(metadata: PackageMetadata, similarPackages: PackageMetadata[]): string {
    // Try to infer from description
    const description = metadata.description?.toLowerCase() || '';
    
    // Common category patterns
    const categoryPatterns: { pattern: RegExp; category: string }[] = [
      { pattern: /date|time|calendar|moment|timestamp/, category: 'Date/Time Manipulation' },
      { pattern: /http|request|fetch|ajax|api/, category: 'HTTP Clients' },
      { pattern: /utility|util|helper|tool/, category: 'Utility Functions' },
      { pattern: /test|testing|spec|assert/, category: 'Testing' },
      { pattern: /css|style|styled/, category: 'CSS-in-JS' },
      { pattern: /state|store|redux|mobx/, category: 'State Management' },
      { pattern: /form|validation|validate|schema/, category: 'Form Validation' },
      { pattern: /template|templating|render/, category: 'Template Engines' },
      { pattern: /log|logging|logger/, category: 'Logging' },
      { pattern: /command|cli|argv|argument/, category: 'Command Line Parsing' },
      { pattern: /env|environment|config/, category: 'Environment Variables' },
      { pattern: /uuid|id|unique/, category: 'UUID Generation' },
    ];

    for (const { pattern, category } of categoryPatterns) {
      if (pattern.test(description)) {
        return category;
      }
    }

    // Fallback: use first significant word from description or name
    const words = this.extractWords(description || metadata.name);
    if (words.length > 0) {
      return words[0].charAt(0).toUpperCase() + words[0].slice(1) + ' Libraries';
    }

    return 'Similar Packages';
  }
}

