use strict;
use warnings;

package MapX;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub set {
    my ( $self, $key, $value ) = @_;
}

sub get {
    my ( $self, $key ) = @_;
    return undef;
}

package Main;

sub new
{
    my $class = shift;
    my $self = {};
    bless $self, $class;
    return $self;
}

sub test {
    my ( $self ) = @_;
    my $map = new MapX();
    $map->set("hello", 3);
    my $num_value = $map->get("hello2");
}