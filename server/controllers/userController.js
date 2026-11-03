
const User = require("../models/User");

// GET MY PROFILE
const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                avatar: user.avatar,
                interests: user.interests,
                role: user.role,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        console.error("Profile error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch profile"
        });
    }
};

// UPDATE MY PROFILE
const updateMyProfile = async (req, res) => {
    try {
        const { name, bio, avatar, interests } = req.body;

        const updates = {};

        if (name !== undefined) {
            if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 50) {
                return res.status(400).json({
                    success: false,
                    message: "Name must contain 2 to 50 characters"
                });
            }

            updates.name = name.trim();
        }

        if (bio !== undefined) {
            if (typeof bio !== "string" || bio.length > 250) {
                return res.status(400).json({
                    success: false,
                    message: "Bio must be 250 characters or fewer"
                });
            }

            updates.bio = bio.trim();
        }

        if (avatar !== undefined) {
            if (typeof avatar !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Avatar must be a string"
                });
            }

            updates.avatar = avatar;
        }

        if (interests !== undefined) {
            if (
                !Array.isArray(interests) ||
                !interests.every(item => typeof item === "string")
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Interests must be an array of strings"
                });
            }

            updates.interests = interests.map(item => item.trim()).filter(Boolean);
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            {
                returnDocument: "after",
                runValidators: true
            }
        );
        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                bio: user.bio,
                avatar: user.avatar,
                interests: user.interests,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Update profile error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update profile"
        });
    }
};

// GET ANOTHER USER'S PUBLIC PROFILE
const getPublicProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.isActive) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                bio: user.bio,
                avatar: user.avatar,
                interests: user.interests,
                createdAt: user.createdAt
            }
        });

    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID"
            });
        }

        res.status(500).json({
            success: false,
            message: "Unable to fetch public profile"
        });
    }
};

module.exports = {
    getMyProfile,
    updateMyProfile,
    getPublicProfile
};
