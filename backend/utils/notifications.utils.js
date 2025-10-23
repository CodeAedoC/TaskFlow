import Notification from "../models/notification.models.js";
import { io } from "../server.js";

export const createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    await notification.populate("sender", "name email");
    await notification.populate("relatedTask", "title");
    await notification.populate("relatedProject", "name color");

    const recipientId = data.recipient.toString();

    console.log(`📤 Emitting notification to recipient: ${recipientId}`);
    console.log(`📦 Notification ID: ${notification._id}`);

    // Emit ONCE to ALL clients
    io.emit("notification:new", {
      recipientId: recipientId,
      notification: notification.toObject(),
    });

    console.log("✅ Notification emitted successfully");

    return notification;
  } catch (error) {
    console.error("❌ Failed to create notification:", error);
    throw error;
  }
};

export const notifyTaskAssignment = async (task, assignedUsers, assignedBy) => {
  const notifications = assignedUsers
    .filter((userId) => userId.toString() !== assignedBy.toString())
    .map((userId) => ({
      recipient: userId,
      sender: assignedBy,
      type: "task_assigned",
      title: "New Task Assigned",
      message: `You have been assigned to "${task.title}"`,
      relatedTask: task._id,
      relatedProject: task.project,
      link: `/dashboard?task=${task._id}`,
    }));

  console.log(
    `📬 Creating ${notifications.length} task assignment notifications`
  );

  for (const notificationData of notifications) {
    await createNotification(notificationData);
  }
};

export const notifyTaskUpdate = async (task, updatedBy, recipients) => {
  // Remove duplicates and filter out the updater
  const uniqueRecipients = [
    ...new Set(recipients.map((id) => id.toString())),
  ].filter((userId) => userId !== updatedBy.toString());

  if (uniqueRecipients.length === 0) {
    console.log("⚠️ No recipients for task update notification");
    return;
  }

  const notifications = uniqueRecipients.map((userId) => ({
    recipient: userId,
    sender: updatedBy,
    type: "task_updated",
    title: "Task Updated",
    message: `"${task.title}" has been updated`,
    relatedTask: task._id,
    relatedProject: task.project,
    link: `/dashboard?task=${task._id}`,
  }));

  console.log(`📬 Creating ${notifications.length} task update notifications`);

  for (const notificationData of notifications) {
    await createNotification(notificationData);
  }
};

export const notifyNewComment = async (comment, task, recipients) => {
  // Remove duplicates and filter out the commenter
  const uniqueRecipients = [
    ...new Set(recipients.map((id) => id.toString())),
  ].filter((userId) => userId !== comment.user.toString());

  if (uniqueRecipients.length === 0) {
    console.log(
      "⚠️ No recipients for comment notification (commenter is only person on task)"
    );
    return;
  }

  const notifications = uniqueRecipients.map((userId) => ({
    recipient: userId,
    sender: comment.user,
    type: "comment_added",
    title: "New Comment",
    message: `New comment on "${task.title}"`,
    relatedTask: task._id,
    relatedProject: task.project,
    link: `/dashboard?task=${task._id}`,
  }));

  console.log(`📬 Creating ${notifications.length} comment notifications`);
  console.log(`📬 Recipients:`, uniqueRecipients);

  for (const notificationData of notifications) {
    await createNotification(notificationData);
  }
};

export const notifyProjectMemberAdded = async (
  project,
  newMemberId,
  addedBy
) => {
  if (newMemberId.toString() === addedBy.toString()) return;

  console.log(`📬 Creating project member added notification`);

  await createNotification({
    recipient: newMemberId,
    sender: addedBy,
    type: "project_added",
    title: "Added to Project",
    message: `You have been added to "${project.name}"`,
    relatedProject: project._id,
    link: `/dashboard?project=${project._id}`,
  });
};
