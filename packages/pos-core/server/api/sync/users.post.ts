// POST /api/sync/users — Main'den POS kullanıcılarını (pos.use + SUPER_ADMIN) çeker, yerel önbelleğe yazar.
import { syncService } from "~~/server/service/sync.service";

export default defineEventHandler(async () => syncService.pullUsers());
