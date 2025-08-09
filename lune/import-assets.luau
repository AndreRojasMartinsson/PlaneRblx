local downloadPlaceAsset = require("./lib/downloadPlaceAsset")
local roblox = require("@lune/roblox")
local fs = require("@lune/fs")

local PLACE_ID = 83903412477262 -- replace with your own place id!

local content = downloadPlaceAsset(PLACE_ID)
local game = roblox.deserializePlace(content)

if not fs.isDir("./map") then
	fs.writeDir("./map")
end

if not fs.isDir("./map/ReplicatedStorage") then
	fs.writeDir("./map/ReplicatedStorage")
end


fs.writeFile("./map/Workspace.rbxm", roblox.serializeModel({ game.Workspace }))
fs.writeFile("./map/Lighting.rbxm", roblox.serializeModel({ game.Lighting }))
fs.writeFile("./map/StarterGui.rbxm", roblox.serializeModel({ game.StarterGui }))

fs.writeFile(`./map/ReplicatedStorage/Buildings.rbxm`, roblox.serializeModel({ game.ReplicatedStorage.Buildings }))
fs.writeFile(`./map/ReplicatedStorage/CityGenerator.rbxm`, roblox.serializeModel({ game.ReplicatedStorage.CityGenerator }))
fs.writeFile(`./map/ReplicatedStorage/Trees.rbxm`, roblox.serializeModel({ game.ReplicatedStorage.Trees }))
fs.writeFile(`./map/ReplicatedStorage/Unique.rbxm`, roblox.serializeModel({ game.ReplicatedStorage.Unique }))
