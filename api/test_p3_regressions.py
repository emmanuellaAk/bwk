import unittest
import uuid

from pydantic import ValidationError

from app.schemas.inventory import StockItemUpdate
from app.schemas.nudge import NudgeResponse
from app.schemas.public import PublicBookingRequest
from app.main import app


class P3RegressionTests(unittest.TestCase):
    def test_inventory_updates_reject_negative_values(self) -> None:
        with self.assertRaises(ValidationError):
            StockItemUpdate(packs=-1)

        with self.assertRaises(ValidationError):
            StockItemUpdate(price_per_pack=-0.01)

    def test_public_booking_rejects_deposit_above_total(self) -> None:
        with self.assertRaises(ValidationError):
            PublicBookingRequest(
                salon_id=uuid.uuid4(),
                client_name="Ama Mensah",
                client_phone="0240000000",
                service_name="Braids",
                date="2026-08-20",
                time="9:00 AM",
                total_price=100,
                deposit=101,
            )

    def test_remaining_protected_routes_are_registered(self) -> None:
        paths = set(app.openapi()["paths"])
        self.assertIn("/v1/nudges", paths)
        self.assertIn("/v1/clients/{client_id}/appointments", paths)
        self.assertIn("/v1/appointments/{appt_id}/cancel", paths)

    def test_nudge_response_uses_frontend_field_names(self) -> None:
        nudge = NudgeResponse(
            id="reorder:item",
            type="reorder",
            title="Low stock",
            body="Review stock",
            primary_label="Review reorder",
            accent="#000000",
            tint="#FFFFFF",
            done_text="Noted",
            dismissed=False,
            acted=False,
        )
        self.assertEqual(nudge.model_dump(by_alias=True)["primaryLabel"], "Review reorder")


if __name__ == "__main__":
    unittest.main()
