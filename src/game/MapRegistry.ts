import { MapConfig } from '../game/MapManager';

/**
 * MapRegistry - Central registry for all available maps
 * Maps are loaded in PreloaderScene and cached here
 */
export class MapRegistry {
  private static instance: MapRegistry;
  private maps: Map<string, MapConfig> = new Map();

  private constructor() { }

  static getInstance(): MapRegistry {
    if (!MapRegistry.instance) {
      MapRegistry.instance = new MapRegistry();
    }
    return MapRegistry.instance;
  }

  /**
   * Load all available maps from the maps directory
   */
  async loadAllMaps(): Promise<void> {
    // Load the index file to get list of available maps
    let mapFiles: string[] = [];
    
    try {
      const indexResponse = await fetch('maps/index.json');
      if (indexResponse.ok) {
        const indexData = await indexResponse.json();
        mapFiles = indexData.maps || [];
        console.log(`Found ${mapFiles.length} maps in index`);
      } else {
        // Fallback to hardcoded list if index.json doesn't exist
        console.warn('maps/index.json not found, using fallback list');
        mapFiles = ['classic', 'spiral', 'zigzag'];
      }
    } catch (error) {
      console.error('Error loading maps index:', error);
      // Fallback to hardcoded list
      mapFiles = ['classic', 'spiral', 'zigzag'];
    }

    const loadPromises = mapFiles.map(async (mapName) => {
      try {
        const response = await fetch(`maps/${mapName}.json`);
        if (!response.ok) {
          console.warn(`Failed to load map: ${mapName}`);
          return;
        }
        const mapConfig: MapConfig = await response.json();
        this.maps.set(mapName, mapConfig);
        console.log(`Loaded map: ${mapName}`);
      } catch (error) {
        console.error(`Error loading map ${mapName}:`, error);
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * Get a specific map by ID
   */
  getMap(mapId: string): MapConfig | undefined {
    return this.maps.get(mapId);
  }

  /**
   * Get all available maps
   */
  getAllMaps(): Array<{ id: string; config: MapConfig }> {
    return Array.from(this.maps.entries()).map(([id, config]) => ({
      id,
      config,
    }));
  }

  /**
   * Check if a map exists
   */
  hasMap(mapId: string): boolean {
    return this.maps.has(mapId);
  }

  /**
   * Get map count
   */
  getMapCount(): number {
    return this.maps.size;
  }
}
