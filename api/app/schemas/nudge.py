from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class NudgeResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    type: Literal["reminder", "reorder"]
    title: str
    body: str
    primary_label: str = Field(alias="primaryLabel")
    accent: str
    tint: str
    done_text: str = Field(alias="doneText")
    dismissed: bool
    acted: bool
