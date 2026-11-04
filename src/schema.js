/**
 * Firebase data contract. Email addresses are deliberately never stored.
 * users/{uid}: {uid, displayName, photoURL, bio, lastActive}
 * users/{uid}/saved/{roomId_messageId}: {roomId, messageId, text, authorName, roomName, savedAt}
 * rooms/{id}: {name, description, type:'space'|'dm', memberIds:[], memberProfiles:{},
 *   ownerId, inviteCode, createdAt, lastMessage, lastMessageAt}
 * rooms/{id}/messages/{id}: {text, senderId, senderName, senderPhoto, createdAt,
 *   editedAt?, deleted?, attachment?, replyTo?, reactions:{key:uid[]}, pinned}
 * rooms/{id}/typing/{uid}: {name, at}
 * invites/{token}: {roomId, roomName, createdBy, expiresAt}
 * calls/{id}: {roomId, callerId, callerName, calleeId, participantIds:[],
 *   video, status, offer, answer?, createdAt}
 * calls/{id}/callerCandidates/{id}, calleeCandidates/{id}: RTCIceCandidate JSON.
 * Offline snapshots are opt-in, scoped to the signed-in uid and cleared on sign-out.
 */
export const LIMITS = { message: 8000, attachment: 10 * 1024 * 1024, roomName: 48, roomDescription: 160 };
