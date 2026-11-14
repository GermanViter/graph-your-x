"""Types partagés : la forme du JSON du contrat API (voir CLAUDE.md)."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Category = Literal["math", "programming", "theory", "tools", "domain"]
EdgeType = Literal["required", "recommended"]


class RoadmapNode(BaseModel):
    id: str
    label: str
    description: str
    category: Category
    difficulty: int = Field(ge=1, le=5)


class RoadmapEdge(BaseModel):
    # "from" est un mot réservé en Python, donc on utilise from_ avec un alias.
    model_config = ConfigDict(populate_by_name=True)

    from_: str = Field(alias="from")
    to: str
    type: EdgeType


class Roadmap(BaseModel):
    goal: str
    nodes: list[RoadmapNode]
    edges: list[RoadmapEdge]


class Topic(BaseModel):
    id: str
    label: str
