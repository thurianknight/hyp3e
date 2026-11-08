
export const SOCKET_NAME = "system.hyp3e";

export const SOCKET_EVENTS = {
  ROLL_GROUP_INITIATIVE: "rollGroupInitiative",
  APPLY_GROUP_INITIATIVE: "applyGroupInitiative"
};

/** Socket payload should look like this:
{
  type: "applyGroupInitiative",
  combatId: string,
  updates: Array<{ _id: string, initiative: number }>,
  // optional metadata for chat / logging
  groupId?: string,
  rollerUserId?: string,
  flavor?: string
}
*/
