import { AssetEntity } from '@app/infra/entities';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AssetResponseDto, IAssetRepository, mapAsset } from '../asset';
import { AuthUserDto } from '../auth';
import { IMachineLearningRepository, ISmartInfoRepository } from '../smart-info';
import { FeatureFlag, ISystemConfigRepository, SystemConfigCore } from '../system-config';
import { SearchDto } from './dto';
import { SearchResponseDto } from './response-dto';
import { SearchExploreItem, SearchStrategy } from './search.repository';

@Injectable()
export class SearchService {
  private timer: NodeJS.Timeout | null = null;
  private logger = new Logger(SearchService.name);
  private configCore: SystemConfigCore;

  constructor(
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IMachineLearningRepository) private machineLearning: IMachineLearningRepository,
    @Inject(ISmartInfoRepository) private smartInfoRepository: ISmartInfoRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
  ) {
    this.configCore = new SystemConfigCore(configRepository);
  }

  async getExploreData(authUser: AuthUserDto): Promise<SearchExploreItem<AssetResponseDto>[]> {
    await this.configCore.requireFeature(FeatureFlag.SEARCH);
    const options = { maxFields: 12, minAssetsPerField: 5 };
    const results = await Promise.all([
      this.assetRepository.getAssetIdsByCity(authUser.id, options),
      this.assetRepository.getAssetIdsByTag(authUser.id, options),
    ]);
    const assetIds = new Set<string>(results.flatMap((field) => field.items.map((item) => item.data)));
    const assets = await this.assetRepository.getByIds(Array.from(assetIds));
    const assetMap = new Map<string, AssetResponseDto>(assets.map((asset) => [asset.id, mapAsset(asset)]));

    return results.map(({ fieldName, items }) => ({
      fieldName,
      items: items.map(({ value, data }) => ({ value, data: assetMap.get(data) as AssetResponseDto })),
    }));
  }

  async search(authUser: AuthUserDto, dto: SearchDto): Promise<SearchResponseDto> {
    const { machineLearning } = await this.configCore.getConfig();
    const query = dto.q || dto.query || '*';
    const hasClip = machineLearning.enabled && machineLearning.clip.enabled;
    const strategy = dto.clip && hasClip ? SearchStrategy.CLIP : SearchStrategy.TEXT;

    let assets: AssetEntity[] = [];

    switch (strategy) {
      case SearchStrategy.CLIP:
        const {
          machineLearning: { clip },
        } = await this.configCore.getConfig();
        const embedding = await this.machineLearning.encodeText(machineLearning.url, { text: query }, clip);
        assets = await this.smartInfoRepository.searchByEmbedding({ ownerId: authUser.id, embedding, numResults: 100 });
        break;
      case SearchStrategy.TEXT:
      default:
        break;
    }

    return {
      albums: {
        total: 0,
        count: 0,
        items: [],
        facets: [],
      },
      assets: {
        total: assets.length,
        count: assets.length,
        items: assets.map((asset) => mapAsset(asset)),
        facets: [],
      },
    };
  }
}
