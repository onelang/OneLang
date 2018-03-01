package One;

sub str_replace
{
    my ($string, $find, $replace) = @_;

    my $pos = index($string, $find);

    while($pos > -1) {
        substr($string, $pos, length($find), $replace);
        $pos = index($string, $find, $pos + length($replace));
    }
    
    return $string;
}

1;