from math import radians, sin, cos, sqrt, atan2

from app.models.emergency_request import EmergencyRequest
from app.models.volunteer import Volunteer


def calculate_distance(
    lat1: float,
    lng1: float,
    lat2: float,
    lng2: float,
) -> float:
    """
    Calculate distance between two coordinates in kilometers.
    """

    earth_radius = 6371.0

    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)

    delta_lat = radians(lat2 - lat1)
    delta_lng = radians(lng2 - lng1)

    a = (
        sin(delta_lat / 2) ** 2
        + cos(lat1_rad)
        * cos(lat2_rad)
        * sin(delta_lng / 2) ** 2
    )

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return earth_radius * c


def calculate_match_score(
    emergency_request: EmergencyRequest,
    volunteer: Volunteer,
) -> dict:

    score = 0
    reasons = []

    # 1. Availability - mandatory
    if not volunteer.availability:
        return {
            "score": 0,
            "eligible": False,
            "reasons": ["Volunteer is not currently available"],
            "distance_km": None,
        }

    # 2. Skill matching
    volunteer_skills = {
        str(skill).upper()
        for skill in (volunteer.skills or [])
    }

    category = (
        emergency_request.category.upper()
        if emergency_request.category
        else ""
    )

    skill_matches = 0

    if category == "FLOOD":
        required_skills = {
            "DISASTER_RESPONSE",
            "WATER_RESCUE",
            "FOOD_DISTRIBUTION",
        }
    elif category == "MEDICAL":
        required_skills = {
            "FIRST_AID",
            "MEDICAL_ASSISTANCE",
        }
    elif category == "FIRE":
        required_skills = {
            "DISASTER_RESPONSE",
            "FIRE_RESPONSE",
        }
    else:
        required_skills = {
            "DISASTER_RESPONSE"
        }

    skill_matches = len(
        volunteer_skills.intersection(required_skills)
    )

    if skill_matches > 0:
        score += min(skill_matches * 20, 40)
        reasons.append(
            f"{skill_matches} relevant skill(s) matched"
        )

    # 3. Medical training
    if emergency_request.injured:
        if volunteer.medical_training:
            score += 25
            reasons.append("Medical training matches injured beneficiaries")
        else:
            reasons.append(
                "Volunteer has no medical training"
            )

    # 4. Vehicle
    if volunteer.vehicle_available:
        score += 10
        reasons.append("Vehicle available")

    # 5. Interest matching
    volunteer_interests = {
        str(interest).upper()
        for interest in (volunteer.interests or [])
    }

    if "DISASTER_RESPONSE" in volunteer_interests:
        score += 10
        reasons.append("Disaster response interest")

    # 6. Distance
    distance_km = calculate_distance(
        emergency_request.location_lat,
        emergency_request.location_lng,
        volunteer.location_lat,
        volunteer.location_lng,
    )

    if distance_km <= 5:
        score += 15
        reasons.append("Volunteer is within 5 km")
    elif distance_km <= 15:
        score += 10
        reasons.append("Volunteer is within 15 km")
    elif distance_km <= 30:
        score += 5
        reasons.append("Volunteer is within 30 km")

    # 7. Priority
    if emergency_request.priority:
        priority = emergency_request.priority.upper()

        if priority == "CRITICAL":
            score += 10
            reasons.append("Critical emergency priority")

        elif priority == "HIGH":
            score += 5
            reasons.append("High emergency priority")

    return {
        "score": min(score, 100),
        "eligible": True,
        "reasons": reasons,
        "distance_km": round(distance_km, 2),
    }


def rank_volunteers(
    emergency_request: EmergencyRequest,
    volunteers: list[Volunteer],
) -> list[dict]:

    results = []

    for volunteer in volunteers:

        match = calculate_match_score(
            emergency_request,
            volunteer,
        )

        if not match["eligible"]:
            continue

        results.append(
            {
                "volunteer_id": volunteer.id,
                "user_id": volunteer.user_id,
                "score": match["score"],
                "distance_km": match["distance_km"],
                "reasons": match["reasons"],
            }
        )

    results.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    return results