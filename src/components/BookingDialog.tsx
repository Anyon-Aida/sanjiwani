"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Modal,
  DatePicker,
  Button,
  Space,
  Divider,
  Typography,
  Select,
  Input,
  Form,
  message,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { DAY_SLOTS, hhmmFromIndex } from "@/lib/booking";

type BookingPayload = {
  date: string;
  startIndex: number;
  durationMin: number;
  serviceId: string;
  serviceName: string;
  customerName: string;
  phone: string;
};

type MinimalService = { id: string; name: string; durations: number[] };

export default function BookingDialog({
  open,
  service,
  defaultDuration,
  onClose,
  onConfirm,
}: {
  open: boolean;
  service: MinimalService;
  defaultDuration: number;
  onClose: () => void;
  onConfirm?: (payload: BookingPayload) => void;
}) {
  const [form] = Form.useForm();
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [duration, setDuration] = useState<number>(defaultDuration);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [disabledStarts, setDisabledStarts] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const dateKey = date.format("YYYY-MM-DD");
  const starts = useMemo(
    () => Array.from({ length: DAY_SLOTS }, (_, i) => ({ i, label: hhmmFromIndex(i) })),
    []
  );

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setPickedIndex(null);
        const res = await fetch(
          `/api/book/availability?date=${dateKey}&duration=${duration}`,
          { cache: "no-store" }
        );
        const json = await res.json();
        if (json?.ok && Array.isArray(json.disabled)) setDisabledStarts(json.disabled);
        else setDisabledStarts([]);
      } catch (e) {
        console.error("availability error", e);
        setDisabledStarts([]);
      }
    })();
  }, [open, dateKey, duration]);

  const onFinish = async (vals: { name: string; phone: string }) => {
    if (pickedIndex == null) {
      message.warning("Válassz időpontot!");
      return;
    }

    const payload: BookingPayload = {
      date: dateKey,
      startIndex: pickedIndex,
      durationMin: duration,
      serviceId: service.id,
      serviceName: service.name,
      customerName: vals.name,
      phone: vals.phone,
    };

    try {
      setLoading(true);
      // debug: ha nem látsz network kérést, ezt látni fogod a konzolban
      console.log("→ submit payload", payload);

      const r = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      let okFlag = false;
      try {
        const j = (await r.json()) as { ok?: boolean };
        okFlag = !!j.ok;
      } catch {
        okFlag = false;
      }

      if (!r.ok || !okFlag) {
        if (r.status === 409) return message.error("Sajnos közben elfogyott ez az időpont. Válassz másikat!");
        return message.error("Nem sikerült lefoglalni. Próbáld újra.");
      }

      message.success("Foglalás rögzítve! Hamarosan visszaigazolunk.");
      onConfirm?.(payload);
      onClose();
    } catch (e) {
      console.error("submit error", e);
      message.error("Hálózati hiba. Próbáld újra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={service.name}
      onOk={() => form.submit()}          // <-- form submit
      okText="Foglalás megerősítése"
      confirmLoading={loading}            // <-- vizuális töltés
      destroyOnClose
    >
      <Form
        id="bookingForm"
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={onFinish}               // <-- ide fut be a submit
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Form.Item name="name" label="Név" rules={[{ required: true, message: "Add meg a neved!" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Telefon" rules={[{ required: true, message: "Add meg a telefonszámod!" }]}>
            <Input />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
          <div>
            <div className="text-sm text-[var(--color-muted)]">Dátum</div>
            <DatePicker
              value={date}
              onChange={(v) => v && setDate(v)}
              disabledDate={(d) =>
                d && d.startOf("day").isBefore(dayjs().startOf("day"))
              }
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <div className="text-sm text-[var(--color-muted)]">Szolgáltatási idő</div>
            <Select
              value={duration}
              onChange={setDuration}
              options={service.durations.map((m) => ({ value: m, label: `${m} perc` }))}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {(["Reggel", "Nap", "Este"] as const).map((group) => {
          const rng = group === "Reggel" ? [0, 6] : group === "Nap" ? [6, 16] : [16, DAY_SLOTS];
          return (
            <div key={group} style={{ marginBottom: 8 }}>
              <Typography.Text type="secondary" style={{ marginLeft: 4 }}>
                {group}
              </Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Space size={[10, 10]} wrap>
                  {starts.slice(rng[0], rng[1]).map(({ i, label }) => {
                    const disabled = disabledStarts.includes(i);
                    const active = pickedIndex === i;
                    return (
                      <Button
                        key={i}
                        type={active ? "primary" : "default"}
                        shape="round"
                        disabled={disabled}
                        onClick={() => !disabled && setPickedIndex(i)}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </Space>
              </div>
              <Divider style={{ margin: "14px 0" }} />
            </div>
          );
        })}
      </Form>
    </Modal>
  );
}
