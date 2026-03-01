import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SAMPLE_SCRIPTS = [
  { title: "Simple Welcome Message", description: "Prints a welcome message when a player joins the game.", madeByAI: true, content: `-- Welcome script
game.Players.PlayerAdded:Connect(function(player)
    print(player.Name .. " joined the game!")
end)

for _, player in ipairs(game.Players:GetPlayers()) do
    print(player.Name .. " is already in the game.")
end` },
  { title: "Click to Change Color", description: "Changes a part's color when clicked.", madeByAI: true, content: `local part = script.Parent

part.ClickDetector.MouseClick:Connect(function()
    part.BrickColor = BrickColor.Random()
end)` },
  { title: "Score Counter", description: "Tracks and displays player score.", madeByAI: true, content: `local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
    local leaderstats = Instance.new("Folder")
    leaderstats.Name = "leaderstats"
    leaderstats.Parent = player

    local score = Instance.new("IntValue")
    score.Name = "Score"
    score.Value = 0
    score.Parent = leaderstats
end)` },
  { title: "Day/Night Cycle", description: "Simple day and night cycle for your game.", madeByAI: true, content: `local Lighting = game:GetService("Lighting")

while true do
    Lighting.ClockTime = 0
    task.wait(120)
    Lighting.ClockTime = 12
    task.wait(120)
end` },
  { title: "Respawn Button", description: "Button that respawns the player when touched.", madeByAI: true, content: `local part = script.Parent
local debounce = false

part.Touched:Connect(function(hit)
    if debounce then return end
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if player then
        debounce = true
        player:LoadCharacter()
        task.wait(1)
        debounce = false
    end
end)` },
  { title: "Chat Filter Helper", description: "Prepares chat for filtering.", madeByAI: true, content: `-- Chat filter setup
game.Players.PlayerAdded:Connect(function(player)
    player.Chatted:Connect(function(message)
        -- Process message before it goes to filter
        print(player.Name .. ": " .. message)
    end)
end)` },
  { title: "Health Display", description: "Shows health above a character.", madeByAI: false, content: `local player = game.Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

humanoid.HealthChanged:Connect(function(health)
    print("Health: " .. health)
end)` },
  { title: "Teleport Pad", description: "Teleports players to a destination.", madeByAI: true, content: `local part = script.Parent
local destination = workspace:WaitForChild("Destination")

part.Touched:Connect(function(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if player and player.Character then
        player.Character:MoveTo(destination.Position + Vector3.new(0, 3, 0))
    end
end)` },
  { title: "Kill Brick", description: "Resets player when they touch this part.", madeByAI: true, content: `local part = script.Parent

part.Touched:Connect(function(hit)
    local humanoid = hit.Parent:FindFirstChild("Humanoid")
    if humanoid then
        humanoid.Health = 0
    end
end)` },
  { title: "Custom Tool Pickup", description: "Gives a tool when player touches the part.", madeByAI: true, content: `local part = script.Parent
local tool = script:WaitForChild("Tool")

part.Touched:Connect(function(hit)
    local player = game.Players:GetPlayerFromCharacter(hit.Parent)
    if player and not player:FindFirstChild("Backpack"):FindFirstChild(tool.Name) then
        local clone = tool:Clone()
        clone.Parent = player.Backpack
    end
end)` },
];

export async function POST() {
  const user = await prisma.user.findFirst({
    where: { username: "testaccount" },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "No test account found. Use Bypass once to create it." }, { status: 400 });
  }
  const existing = await prisma.communityScript.count({ where: { userId: user.id } });
  if (existing >= 10) {
    return NextResponse.json({ ok: true, message: "Already seeded." });
  }
  const toCreate = SAMPLE_SCRIPTS.slice(0, 10 - existing);
  for (const s of toCreate) {
    await prisma.communityScript.create({
      data: {
        userId: user.id,
        title: s.title,
        description: s.description,
        content: s.content,
        madeByAI: s.madeByAI,
      },
    });
  }
  return NextResponse.json({ ok: true, message: `Created ${toCreate.length} test community scripts.` });
}
