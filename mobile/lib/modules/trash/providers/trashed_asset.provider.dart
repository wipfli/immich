import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/modules/trash/services/trash.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/providers/user.provider.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';

class TrashNotifier extends StateNotifier<bool> {
  final Isar _db;
  final Ref ref;
  final TrashService _trashService;
  final log = Logger('TrashNotifier');

  TrashNotifier(
    this._trashService,
    this._db,
    this.ref,
  ) : super(false);

  Future<void> emptyTrash() async {
    try {
      final user = ref.watch(currentUserProvider);
      if (user == null) {
        return;
      }
      await _trashService.updateTrash(deleteAll: true);

      final assets = await _db.assets
          .filter()
          .ownerIdEqualTo(user.isarId)
          .isTrashedEqualTo(true)
          .findAll();

      var dbIds = assets.where((a) => a.isRemote).map((e) => e.id).toList();

      await _db.writeTxn(() async {
        await _db.exifInfos.deleteAll(dbIds);
        await _db.assets.deleteAll(dbIds);
      });

      // Refresh assets in background
      Future.delayed(
        const Duration(seconds: 4),
        () async => await ref.read(assetProvider.notifier).getAllAsset(),
      );
    } catch (error, stack) {
      log.severe("Cannot empty trash ${error.toString()}", error, stack);
    }
  }

  Future<void> restoreTrash() async {
    try {
      final user = ref.watch(currentUserProvider);
      if (user == null) {
        return;
      }
      await _trashService.updateTrash(restoreAll: true);

      final assets = await _db.assets
          .filter()
          .ownerIdEqualTo(user.isarId)
          .isTrashedEqualTo(true)
          .findAll();

      var updatedAssets = assets.where((a) => a.isRemote).map((e) {
        e.isTrashed = false;
        return e;
      }).toList();

      await _db.writeTxn(() async {
        await _db.assets.putAll(updatedAssets);
      });

      // Refresh assets in background
      Future.delayed(
        const Duration(seconds: 4),
        () async => await ref.read(assetProvider.notifier).getAllAsset(),
      );
    } catch (error, stack) {
      log.severe("Cannot restore trash ${error.toString()}", error, stack);
    }
  }
}

final trashProvider = StateNotifierProvider<TrashNotifier, bool>((ref) {
  return TrashNotifier(
    ref.watch(trashServiceProvider),
    ref.watch(dbProvider),
    ref,
  );
});

final trashedAssetsProvider = StreamProvider<RenderList>((ref) async* {
  final user = ref.watch(currentUserProvider);
  if (user == null) return;
  final query = ref
      .watch(dbProvider)
      .assets
      .filter()
      .ownerIdEqualTo(user.isarId)
      .isTrashedEqualTo(true)
      .sortByFileCreatedAt();
  const groupBy = GroupAssetsBy.none;
  yield await RenderList.fromQuery(query, groupBy);
  await for (final _ in query.watchLazy()) {
    yield await RenderList.fromQuery(query, groupBy);
  }
});