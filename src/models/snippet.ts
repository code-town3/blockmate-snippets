/**
 * Snippet data model for BlockMate Snippets
 */
export interface Snippet {
    id: string;
    name: string;
    prefix: string;
    description?: string;
    body: string;
    tags: string[];
    fileTypes: string[];
    createdAt: Date;
    updatedAt: Date;
    usageCount: number;
    isFavorite: boolean;
    scope?: string; // 'global' | 'workspace' | 'project'
}

/**
 * Snippet creation/update request model
 */
export interface SnippetRequest {
    name: string;
    prefix: string;
    description?: string;
    body: string;
    tags?: string[];
    fileTypes?: string[];
    scope?: string;
}

/**
 * Snippet search and filter options
 */
export interface SnippetFilter {
    tags?: string[];
    fileTypes?: string[];
    searchTerm?: string;
    favoritesOnly?: boolean;
    scope?: string;
}

/**
 * Snippet statistics
 */
export interface SnippetStats {
    totalSnippets: number;
    totalUsage: number;
    mostUsedSnippet?: Snippet;
    recentSnippets: Snippet[];
    tagStats: { [tag: string]: number };
    fileTypeStats: { [fileType: string]: number };
} 
