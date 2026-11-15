-- Allow the extended note color palette (24 colors). Must match NOTE_COLORS in app/src/lib/theme.ts.
alter table public.notes drop constraint if exists notes_color_check;
alter table public.notes add constraint notes_color_check check (color in (
  'yellow','lemon','amber','orange','peach','red',
  'rose','pink','magenta','purple','violet','indigo',
  'blue','sky','cyan','teal','mint','green',
  'lime','olive','sand','brown','gray','slate'
));
