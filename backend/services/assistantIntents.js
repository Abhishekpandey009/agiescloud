const { Types } = require('mongoose');
const File = require('../models/File');

const escapeRegex = (text = '') => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const handleAssistantIntent = async (ownerId, raw) => {
  if (!ownerId) return null;
  const text = String(raw || '').toLowerCase();

  // 1) Find my last presentation
  if (/\b(find|show)\b.*\b(last|latest)\b.*\b(presentation|slides?|ppt|powerpoint)\b/.test(text)) {
    const presRegex = /(powerpoint|presentation|slides?)/i;
    const result = await File.find({ ownerId, isDeleted: false, $or: [
      { mimeType: { $regex: /(powerpoint|presentation)/i } },
      { type: { $in: ['ppt', 'pptx', 'key'] } },
      { originalName: { $regex: presRegex } },
      { $and: [{ mimeType: { $regex: /pdf/i } }, { originalName: { $regex: presRegex } }] }
    ]}).sort({ createdAt: -1 }).limit(1);
    if (result.length) {
      const f = result[0];
      return `Your latest presentation seems to be "${f.originalName}" (${formatBytes(f.size)}), uploaded on ${new Date(f.createdAt).toLocaleString()}.`;
    }
    return 'I could not find a recent presentation in your files.';
  }

  // 2) Summarize <name fragment>
  const sumMatch = text.match(/\bsummarize\b(?:\s+this|\s+the)?(?:\s+(pdf|file))?(?:\s+(named|called))?\s+\"?([^\"]+)\"?/);
  if (sumMatch && sumMatch[3]) {
    let fragment = sumMatch[3].trim().replace(/["'“”‘’\s]+$/g, '').replace(/[.,!?;:]+$/g, '').trim();
    const regex = new RegExp(escapeRegex(fragment), 'i');
    let f = await File.findOne({ ownerId, isDeleted: false, $or: [
      { originalName: { $regex: regex } },
      { tags: { $in: [regex] } }
    ]}).sort({ createdAt: -1 });
    if (!f && (/(resume|cv|curriculum vitae)/.test(text) || /(resume|cv|curriculum vitae)/.test(fragment))) {
      const r = /(resume|cv|curriculum vitae)/i;
      f = await File.findOne({ ownerId, isDeleted: false, $or: [
        { originalName: { $regex: r } },
        { tags: { $elemMatch: { $regex: r } } }
      ]}).sort({ createdAt: -1 });
    }
    if (f) {
      const ext = f.originalName.split('.').pop().toLowerCase();
      const meta = f.metadata || {};
      const parts = [
        `Name: ${f.originalName}`,
        `Type: ${f.mimeType} (.${ext})`,
        `Size: ${formatBytes(f.size)}`,
        `Uploaded: ${new Date(f.createdAt).toLocaleString()}`,
        (f.tags && f.tags.length ? `Tags: ${f.tags.slice(0, 8).join(', ')}` : null),
        (meta.pages ? `Pages: ${meta.pages}` : null),
        (meta.duration ? `Duration: ${meta.duration}s` : null),
        (meta.width && meta.height ? `Dimensions: ${meta.width}x${meta.height}` : null)
      ].filter(Boolean);
      return `Here's a quick summary based on file metadata:\n\n${parts.join('\n')}`;
    }
    return `I couldn't find a file matching "${fragment}". Try a more specific name (e.g., part of the filename).`;
  }

  // 3) Suggest files to delete
  if (/\b(suggest|recommend)\b.*\b(delete|remove|clean)\b/.test(text)) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const oldLarge = await File.find({ ownerId, isDeleted: false, isFavorite: false, isShared: false, lastAccessed: { $lte: ninetyDaysAgo } })
      .sort({ size: -1 }).limit(5).select('originalName size lastAccessed');
    const dupAgg = await File.aggregate([
      { $match: { ownerId: new Types.ObjectId(ownerId), isDeleted: false, 'metadata.checksum': { $exists: true, $ne: null } } },
      { $group: { _id: '$metadata.checksum', count: { $sum: 1 }, anyName: { $first: '$originalName' } } },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);
    const lines = [];
    if (oldLarge.length) {
      lines.push('Old & large files (unused ~90+ days):');
      oldLarge.forEach(f => lines.push(`• ${f.originalName} — ${formatBytes(f.size)} (last accessed ${new Date(f.lastAccessed).toLocaleDateString()})`));
    }
    if (dupAgg.length) {
      lines.push('Duplicate groups detected:');
      dupAgg.forEach(d => lines.push(`• ${d.anyName} (and ${d.count - 1} more). Use Duplicate Cleanup in AI Insights.`));
    }
    if (!lines.length) return 'No obvious candidates found. You can try checking duplicates in AI Insights.';
    return lines.join('\n');
  }

  // 4) Largest files
  if (/\b(largest|biggest)\b.*\bfiles?\b/.test(text)) {
    const nMatch = text.match(/top\s*(\d+)/);
    const limit = Math.min(parseInt(nMatch?.[1] || '5', 10) || 5, 20);
    const files = await File.find({ ownerId, isDeleted: false })
      .sort({ size: -1 }).limit(limit).select('originalName size lastAccessed');
    if (!files.length) return 'No files found.';
    const lines = files.map((f, idx) => `${idx + 1}. ${f.originalName} — ${formatBytes(f.size)} (last accessed ${new Date(f.lastAccessed).toLocaleDateString()})`);
    return `Largest files:\n${lines.join('\n')}`;
  }

  // 5) Recent files by type
  const recentType = text.match(/\brecent\b.*\b(images?|pictures?|pics|photos|documents?|docs?|videos?|audio|pdfs?)\b/);
  if (recentType) {
    const typeWord = recentType[1] || recentType[0];
    let mimeRegex = /./;
    if (/image|picture|photo|pic/.test(typeWord)) mimeRegex = /image/i;
    else if (/video/.test(typeWord)) mimeRegex = /video/i;
    else if (/audio/.test(typeWord)) mimeRegex = /audio/i;
    else if (/pdf/.test(typeWord)) mimeRegex = /pdf/i;
    else if (/doc/.test(typeWord) || /document/.test(typeWord)) mimeRegex = /(pdf|doc|docx|txt|sheet|excel|ppt|powerpoint)/i;
    const files = await File.find({ ownerId, isDeleted: false, mimeType: { $regex: mimeRegex } })
      .sort({ createdAt: -1 }).limit(5).select('originalName size createdAt');
    if (!files.length) return `No recent ${typeWord} found.`;
    const lines = files.map(f => `• ${f.originalName} — ${formatBytes(f.size)} (uploaded ${new Date(f.createdAt).toLocaleDateString()})`);
    return `Recent ${typeWord}:\n${lines.join('\n')}`;
  }

  // 6) Find my resume / cv
  if (/\b(resume|cv|curriculum vitae)\b/.test(text)) {
    const regex = /(resume|cv|curriculum vitae)/i;
    const file = await File.findOne({ ownerId, isDeleted: false, $or: [
      { originalName: { $regex: regex } },
      { tags: { $elemMatch: { $regex: regex } } }
    ]}).sort({ createdAt: -1 });
    if (file) {
      return `Your latest resume seems to be "${file.originalName}" (${formatBytes(file.size)}), uploaded on ${new Date(file.createdAt).toLocaleString()}.`;
    }
    return 'I could not find a recent resume in your files.';
  }

  // 7) File inventory questions
  if ((/how many/.test(text) && /files/.test(text)) || /files have i uploaded/.test(text) || /\bfile count\b/.test(text) || /\bhow much storage\b/.test(text)) {
    const ownerObjectId = new Types.ObjectId(ownerId);
    const [stats] = await File.aggregate([
      { $match: { ownerId: ownerObjectId, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$size' },
          tagged: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$tags', []] } }, 0] }, 1, 0] } }
        }
      }
    ]);
    const totalFiles = stats?.totalFiles || 0;
    const totalSize = stats?.totalSize || 0;
    const taggedFiles = stats?.tagged || 0;
    const tagCoverage = totalFiles ? Math.round((taggedFiles / totalFiles) * 100) : 0;
    return `You currently store ${totalFiles} files totalling ${formatBytes(totalSize)}. About ${tagCoverage}% of them carry tags. Ask me for folders or duplicates if you want to optimize further.`;
  }

  // 8) Rename files when user supplies current and new names
  const renameExplicit = text.match(/current name is\s+\"?([^\"\n]+?)\"?\s+(?:and\s+)?new name (?:should be|is)\s+\"?([^\"\n]+?)\"?/i);
  const renameSimple = text.match(/(?:rename|change)\s+(?:the\s+)?(?:file\s+)?(?:(?:named|called)\s+)?\"?([^\"\n]+?)\"?\s+(?:to|as)\s+\"?([^\"\n]+?)\"?/i);
  const renameMatch = renameExplicit || renameSimple;
  if (renameMatch) {
    const currentRaw = renameMatch[1].trim();
    const desiredRaw = renameMatch[2].trim();
    if (!currentRaw || !desiredRaw) {
      return 'Share both the current file name and the new name so I can rename it.';
    }
    const exactRegex = new RegExp(`^${escapeRegex(currentRaw)}$`, 'i');
    let file = await File.findOne({ ownerId, isDeleted: false, originalName: { $regex: exactRegex } });
    if (!file) {
      const containsRegex = new RegExp(escapeRegex(currentRaw), 'i');
      file = await File.findOne({ ownerId, isDeleted: false, originalName: { $regex: containsRegex } });
    }
    if (!file) {
      return `I couldn't find a file named "${currentRaw}". Give me the exact name you see in storage.`;
    }
    let targetName = desiredRaw.replace(/["']/g, '').trim();
    if (!targetName) {
      return 'Provide a valid new file name so I can finish the rename.';
    }
    const hasExt = /\.[a-z0-9]{2,}$/i.test(targetName);
    if (!hasExt && file.originalName.includes('.')) {
      const ext = file.originalName.split('.').pop();
      if (ext) targetName = `${targetName}.${ext}`;
    }
    const duplicateRegex = new RegExp(`^${escapeRegex(targetName)}$`, 'i');
    const duplicate = await File.findOne({ ownerId, isDeleted: false, _id: { $ne: file._id }, originalName: { $regex: duplicateRegex } });
    if (duplicate) {
      return `There is already a file called "${targetName}". Pick a different name to avoid confusion.`;
    }
    const previousName = file.originalName;
    file.originalName = targetName;
    file.filename = targetName;
    file.markModified('originalName');
    file.markModified('filename');
    await file.save();
    return `Renamed "${previousName}" to "${targetName}". Add tags like resume or career so it stays easy to find.`;
  }

  // 9) Locate files when user provides a name
  const nameStatement = text.match(/(?:file\s+name|name)\s+(?:is|=)\s+\"?([^\"\n]+?)\"?(?:\.|$)/i);
  if (nameStatement) {
    const rawName = nameStatement[1].trim();
    if (rawName.length < 2) {
      return 'Give me at least a couple of characters from the file name so I can look it up.';
    }
    const regex = new RegExp(escapeRegex(rawName), 'i');
    const file = await File.findOne({ ownerId, isDeleted: false, originalName: { $regex: regex } })
      .select('originalName size mimeType tags updatedAt createdAt');
    if (!file) {
      return `No file matching "${rawName}" came up. Double-check the spelling or share another hint.`;
    }
    const summaryParts = [
      `Found "${file.originalName}" (${formatBytes(file.size)})`,
      file.tags?.length ? `Tags: ${file.tags.slice(0, 4).join(', ')}` : null,
      file.mimeType ? `Type: ${file.mimeType}` : null
    ].filter(Boolean);
    return `${summaryParts.join(' • ')}. Want me to rename it or add tags?`;
  }

  // 10) Vague search prompt
  if (/\bsearch\b/.test(text) && /\bfile\b/.test(text)) {
    return 'Tell me part of the file name, type, or a tag and I\'ll dig it up for you.';
  }

  return null;
};

module.exports = {
  handleAssistantIntent,
  escapeRegex,
  formatBytes
};
