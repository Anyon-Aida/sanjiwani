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
import { OPEN_HOUR, STEP_MIN, DAY_SLOTS, hhmmFromIndex } from "@/lib/booking";
import { fmtHUF } from "@/lib/pricing";

type BookingPayload = {
  date: string;
  startIndex: number;
  durationMin: number;
  serviceId: string;
  serviceName: string;
  customerName: string;
  phone: string;
  email?: string;
};

type MinimalService = {
  id: string;
  name: string;
  durations: number[];
};

export default function BookingDialog({
  open,
  service,
  defaultDuration,
  onClose,
  onConfirm,
  pricesByDuration,
}: {
  open: boolean;
  service: MinimalService;
  defaultDuration: number;
  onClose: () => void;
  onConfirm?: (payload: BookingPayload) => void;
  pricesByDuration?: Record<number, number>;
}) {
  const [form] = Form.useForm();
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [duration, setDuration] = useState<number>(defaultDuration);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const [disabledStarts, setDisabledStarts] = useState<number[]>([]);

  const dateKey = date.format("YYYY-MM-DD");

  // ár a katalógusból, fallback ha nincs
  const price = useMemo(() => {
    return pricesByDuration?.[duration] ?? 0;
  }, [duration, pricesByDuration]);

  const starts = useMemo(
    () => Array.from({ length: DAY_SLOTS }, (_, i) => ({ i, label: hhmmFromIndex(i) })),
    []
  );

  // elérhetőség lekérés
  useEffect(() => {
    (async () => {
      setPickedIndex(null);
      const r = await fetch(
        `/api/book/availability?date=${dateKey}&duration=${duration}`,
        { cache: "no-store" }
      );
      const j = await r.json();
      if (j.ok) setDisabledStarts(j.disabled as number[]);
      else setDisabledStarts([]);
    })();
  }, [dateKey, duration]);

  // aznapi múltbeli slotok tiltása
  const disabledWithPast = useMemo(() => {
    if (!date.isSame(dayjs(), "day")) return disabledStarts;
    const now = dayjs();
    const minutesFromOpen = now.hour() * 60 + now.minute() - OPEN_HOUR * 60;
    const nowIndex = Math.floor(Math.max(0, minutesFromOpen) / STEP_MIN);
    const extra = starts.filter((s) => s.i <= nowIndex).map((s) => s.i);
    return Array.from(new Set([...disabledStarts, ...extra]));
  }, [disabledStarts, date, starts]);

  const submit = async () => {
    try {
      const vals = await form.validateFields();
      if (pickedIndex == null) return message.warning("Válassz időpontot!");

      const payload = {
        date: dateKey,
        startIndex: pickedIndex,
        durationMin: duration,
        serviceId: service.id,
        serviceName: service.name,
        customerName: vals.name as string,
        phone: vals.phone as string,
        email: vals.email as string | undefined,
      };

      const r = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();

      if (!j.ok) {
        if (r.status === 409)
          return message.error("Sajnos közben elfogyott ez az időpont.");
        return message.error("Nem sikerült lefoglalni. Próbáld újra.");
      }

      message.success("Sikeres foglalás! Küldtünk visszaigazoló e-mailt is.");
      onClose();
      form.resetFields();
      setPickedIndex(null);
    } catch {
      /* no-op */
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={service.name}
      onOk={submit}
      okText={`Foglalás megerősítése – ${fmtHUF(price)}`}
    >
      <Form form={form} layout="vertical" requiredMark={false}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Form.Item
            name="name"
            label="Név"
            rules={[{ required: true, message: "Kötelező" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Telefon"
            rules={[{ required: true, message: "Kötelező" }]}
          >
            <Input />
          </Form.Item>
        </div>

        <Form.Item
          name="email"
          label="E-mail (visszaigazoláshoz)"
          rules={[{ type: "email", message: "Érvénytelen e-mail" }]}
        >
          <Input />
        </Form.Item>

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
            <div className="text-sm text-[var(--color-muted)]">
              Szolgáltatási idő
            </div>
            <Select
              value={duration}
              onChange={setDuration}
              options={service.durations.map((m) => ({
                value: m,
                label: `${m} perc`,
              }))}
              style={{ width: "100%" }}
            />
            <div className="mt-2 text-sm">
              Végösszeg: <b>{fmtHUF(price)}</b>
            </div>
          </div>
        </div>

        {(["Reggel", "Nap", "Este"] as const).map((group) => {
          const rng =
            group === "Reggel" ? [0, 6] : group === "Nap" ? [6, 16] : [16, DAY_SLOTS];
          return (
            <div key={group} style={{ marginBottom: 8 }}>
              <Typography.Text type="secondary" style={{ marginLeft: 4 }}>
                {group}
              </Typography.Text>
              <div style={{ marginTop: 8 }}>
                <Space size={[10, 10]} wrap>
                  {starts.slice(rng[0], rng[1]).map(({ i, label }) => {
                    const disabled = disabledWithPast.includes(i);
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
