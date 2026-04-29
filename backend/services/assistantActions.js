const File = require('../models/File');

// Extract JSON action from model output
function extractJsonAction(text = '') {
  if (!text || typeof text !== 'string') return null;
  // Prefer fenced code block ```json ... ```
  const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
  let payload = fenced ? fenced[1] : text;
  // Find first '{' and last '}' window
  const start = payload.indexOf('{');
  const end = payload.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const jsonStr = payload.slice(start, end + 1);
  try {
    const obj = JSON.parse(jsonStr);
    if (obj && typeof obj === 'object' && typeof obj.action === 'string') return obj;
    return null;
  } catch (_) {
    return null;
  }
}

async function resolveByName(ownerId, name) {
  if (!ownerId || !name) return { file: null, matches: 0 };
  const exact = await File.find({ ownerId, originalName: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') } }).limit(2);
  if (exact.length === 1) return { file: exact[0], matches: 1 };
  if (exact.length > 1) return { file: null, matches: exact.length };
  const contains = await File.find({ ownerId, isDeleted: false, originalName: { $regex: new RegExp(escapeRegex(name), 'i') } }).limit(6);
  if (contains.length === 1) return { file: contains[0], matches: 1 };
  return { file: contains[0] || null, matches: contains.length };
}

function escapeRegex(text = '') {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function executeAssistantAction(ownerId, actionObj = {}) {
  const action = String(actionObj.action || '').toLowerCase();
  const fileName = actionObj.file && String(actionObj.file).trim();

  if (!action) return { ok: false, message: 'No action provided.' };

  // Actions that require a file
  const needsFile = ['rename_file', 'delete_file', 'recover_file', 'favorite_file', 'share_file', 'summarize_file', 'get_info'];
  if (needsFile.includes(action) && !fileName) {
    return { ok: false, message: 'Please provide the file name.' };
  }

  let target = null;
  if (fileName) {
    const { file, matches } = await resolveByName(ownerId, fileName);
    if (matches > 1) return { ok: false, message: `Multiple files match "${fileName}". Please specify the exact name.` };
    if (!file) return { ok: false, message: `File "${fileName}" not found.` };
    target = file;
  }

  switch (action) {
    case 'rename_file': {
      let newName = (actionObj.newName || '').toString().trim();
      if (!newName) return { ok: false, message: 'Provide the newName for rename.' };
      const keepExt = !/\.[a-z0-9]{2,}$/i.test(newName);
      if (keepExt && target.originalName.includes('.')) {
        const ext = target.originalName.split('.').pop();
        if (ext) newName = `${newName}.${ext}`;
      }
      const dup = await File.findOne({ ownerId, isDeleted: false, _id: { $ne: target._id }, originalName: { $regex: new RegExp(`^${escapeRegex(newName)}$`, 'i') } });
      if (dup) return { ok: false, message: `A file named "${newName}" already exists.` };
      const prev = target.originalName;
      target.originalName = newName;
      target.filename = newName;
      target.markModified('originalName');
      target.markModified('filename');
      await target.save();
      return { ok: true, message: `Renamed "${prev}" to "${newName}".`, data: { fileId: target._id, oldName: prev, newName } };
    }
    case 'delete_file': {
      if (target.isDeleted) return { ok: true, message: `"${target.originalName}" is already in trash.`, data: { fileId: target._id } };
      target.isDeleted = true;
      target.deletedAt = new Date();
      await target.save();
      return { ok: true, message: `Moved "${target.originalName}" to trash.`, data: { fileId: target._id } };
    }
    case 'recover_file': {
      if (!target.isDeleted) return { ok: true, message: `"${target.originalName}" is not in trash.`, data: { fileId: target._id } };
      target.isDeleted = false;
      target.deletedAt = null;
      await target.save();
      return { ok: true, message: `Restored "${target.originalName}" from trash.`, data: { fileId: target._id } };
    }
    case 'favorite_file': {
      if (target.isFavorite) return { ok: true, message: `"${target.originalName}" is already a favorite.`, data: { fileId: target._id } };
      target.isFavorite = true;
      await target.save();
      return { ok: true, message: `Marked "${target.originalName}" as favorite.`, data: { fileId: target._id } };
    }
    case 'share_file': {
      const shareWith = actionObj.shareWith;
      const emails = Array.isArray(shareWith) ? shareWith : (shareWith ? [shareWith] : []);
      if (!emails.length) return { ok: false, message: 'Provide shareWith (email) to share the file.' };
      for (const email of emails) {
        try { await target.shareWith(String(email).toLowerCase().trim(), 'view'); } catch (_) {}
      }
      return { ok: true, message: `Shared "${target.originalName}" with ${emails.join(', ')}.`, data: { fileId: target._id, emails } };
    }
    case 'summarize_file': {
      // We do not have content in chat; provide next step for frontend/backend
      return { ok: true, message: 'I don’t have access to the file content yet. Please upload the file or request a backend summary.', data: { fileId: target._id } };
    }
    case 'get_info': {
      const meta = target.metadata || {};
      return {
        ok: true,
        message: `${target.originalName} • ${formatBytes(target.size)} • ${target.mimeType}`,
        data: {
          fileId: target._id,
          originalName: target.originalName,
          size: target.size,
          mimeType: target.mimeType,
          createdAt: target.createdAt,
          tags: target.tags || [],
          pages: meta.pages || null,
          duration: meta.duration || null,
          dimensions: (meta.width && meta.height) ? { width: meta.width, height: meta.height } : null
        }
      };
    }
    case 'none':
      return { ok: true, message: '' };
    default:
      return { ok: false, message: `Unknown action: ${action}` };
  }
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

module.exports = {
  extractJsonAction,
  executeAssistantAction
};
