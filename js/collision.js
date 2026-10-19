export function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function resolvePlatformCollision(player, platform, previous) {
  const playerBox = player.getBox();
  if (!intersects(playerBox, platform)) return false;

  const wasAbove = previous.y + player.height <= platform.y + 1;
  const wasBelow = previous.y >= platform.y + platform.height - 1;
  const wasLeft = previous.x + player.width <= platform.x + 1;
  const wasRight = previous.x >= platform.x + platform.width - 1;

  if (player.vy >= 0 && wasAbove) {
    player.y = platform.y - player.height;
    player.vy = 0;
    player.onGround = true;
    return true;
  }

  if (player.vy < 0 && wasBelow) {
    player.y = platform.y + platform.height;
    player.vy = 0;
    return true;
  }

  if (wasLeft) {
    player.x = platform.x - player.width;
    player.vx = 0;
    return true;
  }

  if (wasRight) {
    player.x = platform.x + platform.width;
    player.vx = 0;
    return true;
  }

  return false;
}